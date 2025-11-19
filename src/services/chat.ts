import { supabase } from './supabase';
import type { ChatConversation, ChatMessage, Wine } from '../types';
import { matchWinesToLwin, getPriceStats, getCriticScores, getWineInfo } from './winelabs';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Create a new general chat conversation (not wine-specific)
 */
export async function createGeneralChatConversation(
  imageUrl?: string
): Promise<ChatConversation> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: session.session.user.id,
      image_url: imageUrl,
      title: 'New Chat',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    wineId: data.wine_id,
    scanId: data.scan_id,
    imageUrl: data.image_url,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create a new chat conversation about a wine
 */
export async function createChatConversation(
  wine: Wine,
  imageUrl?: string,
  scanId?: string
): Promise<ChatConversation> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .insert({
      user_id: session.session.user.id,
      wine_id: wine.id,
      scan_id: scanId,
      image_url: imageUrl,
      title: `Chat about ${wine.displayName}`,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    wineId: data.wine_id,
    scanId: data.scan_id,
    imageUrl: data.image_url,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get a single conversation by ID
 */
export async function getChatConversation(conversationId: string): Promise<ChatConversation | null> {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    wineId: data.wine_id,
    scanId: data.scan_id,
    imageUrl: data.image_url,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get all conversations for the current user
 */
export async function getChatConversations(): Promise<ChatConversation[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', session.session.user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(conv => ({
    id: conv.id,
    userId: conv.user_id,
    wineId: conv.wine_id,
    scanId: conv.scan_id,
    imageUrl: conv.image_url,
    title: conv.title,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  }));
}

/**
 * Get messages for a conversation
 */
export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(msg => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    role: msg.role,
    content: msg.content,
    imageUrl: msg.image_url,
    createdAt: msg.created_at,
  }));
}

/**
 * Send a message and get AI response
 */
export async function sendChatMessage(
  conversationId: string,
  message: string,
  wine?: Wine,
  imageUrl?: string
): Promise<ChatMessage> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  // Save user message
  const { data: userMessage, error: userError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (userError) {
    throw userError;
  }

  // Get conversation history
  const messages = await getChatMessages(conversationId);

  // Get AI response
  const aiResponse = await getAIResponse(message, messages, wine, imageUrl);

  // Save AI response
  const { data: assistantMessage, error: assistantError } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: aiResponse,
    })
    .select()
    .single();

  if (assistantError) {
    throw assistantError;
  }

  return {
    id: assistantMessage.id,
    conversationId: assistantMessage.conversation_id,
    role: assistantMessage.role,
    content: assistantMessage.content,
    imageUrl: assistantMessage.image_url,
    createdAt: assistantMessage.created_at,
  };
}

/**
 * Extract wine name and vintage from user message
 */
function extractWineFromMessage(message: string): { wineName?: string; vintage?: string } | null {
  // Pattern 1: "2022 Orin Swift Mercury Head Cabernet Sauvignon" or similar
  // Matches: year followed by wine name (captures everything after year until end or common wine terms)
  const vintagePattern = /(\d{4})\s+(.+?)(?:\s+(?:cabernet|pinot|chardonnay|merlot|syrah|shiraz|riesling|sauvignon|blanc|noir|price|cost|review|rating|$)|$)/i;
  const vintageMatch = message.match(vintagePattern);
  if (vintageMatch && vintageMatch[2] && vintageMatch[2].trim().length > 3) {
    return {
      vintage: vintageMatch[1],
      wineName: vintageMatch[2].trim(),
    };
  }

  // Pattern 2: "search 2022 Orin Swift..." or "use wine labs api for 2022..."
  const searchVintagePattern = /(?:search|find|lookup|price|info|information|about|use\s+wine\s+labs\s+api\s+for|use\s+the\s+wine\s+labs\s+api\s+for)\s+(?:the\s+)?(\d{4})\s+(.+?)(?:\s+(?:cabernet|pinot|chardonnay|merlot|syrah|shiraz|riesling|sauvignon|blanc|noir|price|cost|review|rating|$)|$)/i;
  const searchVintageMatch = message.match(searchVintagePattern);
  if (searchVintageMatch && searchVintageMatch[2] && searchVintageMatch[3] && searchVintageMatch[3].trim().length > 3) {
    return {
      vintage: searchVintageMatch[2],
      wineName: searchVintageMatch[3].trim(),
    };
  }

  // Pattern 3: Wine name without vintage after "search", "find", "use wine labs api", etc.
  const searchPattern = /(?:search|find|lookup|price|info|information|about|use\s+wine\s+labs\s+api\s+for|use\s+the\s+wine\s+labs\s+api\s+for)\s+(?:the\s+)?([A-Z][^.!?\n]+?)(?:\s+(?:cabernet|pinot|chardonnay|merlot|syrah|shiraz|riesling|sauvignon|blanc|noir|price|cost|review|rating|$)|$)/i;
  const searchMatch = message.match(searchPattern);
  if (searchMatch && searchMatch[1] && searchMatch[1].trim().length > 5) {
    return {
      wineName: searchMatch[1].trim(),
    };
  }

  // Pattern 4: Just a wine name that looks like a proper noun (starts with capital, multiple words)
  // This catches cases like "Orin Swift Mercury Head Cabernet Sauvignon" without keywords
  const wineNameOnlyPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,}(?:\s+(?:Cabernet|Pinot|Chardonnay|Merlot|Syrah|Shiraz|Riesling|Sauvignon|Blanc|Noir))?)/;
  const nameOnlyMatch = message.match(wineNameOnlyPattern);
  if (nameOnlyMatch && nameOnlyMatch[1] && nameOnlyMatch[1].trim().length > 10) {
    return {
      wineName: nameOnlyMatch[1].trim(),
    };
  }

  return null;
}

/**
 * Get AI response using Gemini API
 */
async function getAIResponse(
  userMessage: string,
  history: ChatMessage[],
  wine?: Wine,
  imageUrl?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  // Check if user wants to use Wine Labs API or asks about a specific wine
  const wantsWineLabs = userMessage.toLowerCase().includes('wine labs') || 
                        userMessage.toLowerCase().includes('winelabs') ||
                        userMessage.toLowerCase().includes('use the wine labs api');
  
  // Extract wine information from message if user asks about a specific wine
  let wineLabsData = '';
  if (wantsWineLabs || userMessage.toLowerCase().includes('price') || userMessage.toLowerCase().includes('current price')) {
    const extractedWine = extractWineFromMessage(userMessage);
    const wineToSearch = extractedWine?.wineName || wine?.displayName;
    const vintageToSearch = extractedWine?.vintage || wine?.vintage;

    if (wineToSearch) {
      try {
        console.log(`[Chat] Searching Wine Labs API for: ${wineToSearch} ${vintageToSearch || ''}`);
        
        // Match wine to LWIN
        const matches = await matchWinesToLwin([wineToSearch]);
        const match = matches[0];
        
        if (match?.lwin) {
          wineLabsData = `\n\nWine Labs API Data for "${match.display_name || wineToSearch}":`;
          
          // Get price stats
          try {
            const priceStats = await getPriceStats(undefined, match.lwin);
            if (priceStats.median) {
              wineLabsData += `\n- Market Price (median): $${priceStats.median}`;
              if (priceStats.min && priceStats.max) {
                wineLabsData += ` (range: $${priceStats.min} - $${priceStats.max})`;
              }
            }
          } catch (e) {
            console.error('[Chat] Error fetching price stats:', e);
          }

          // Get critic scores
          try {
            const scores = await getCriticScores(undefined, match.lwin, vintageToSearch);
            if (scores.length > 0) {
              const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
              wineLabsData += `\n- Critic Score: ${avgScore.toFixed(1)}/100 (from ${scores.length} critics)`;
              const topScore = scores.reduce((max, s) => s.score > max.score ? s : max);
              wineLabsData += `\n- Top Critic: ${topScore.critic} (${topScore.score}/100)`;
            }
          } catch (e) {
            console.error('[Chat] Error fetching critic scores:', e);
          }

          // Get wine info
          try {
            const wineInfo = await getWineInfo(undefined, match.lwin);
            if (wineInfo) {
              if (wineInfo.varietal) wineLabsData += `\n- Varietal: ${wineInfo.varietal}`;
              if (wineInfo.region) wineLabsData += `\n- Region: ${wineInfo.region}`;
              if (wineInfo.producer) wineLabsData += `\n- Producer: ${wineInfo.producer}`;
            }
          } catch (e) {
            console.error('[Chat] Error fetching wine info:', e);
          }

          wineLabsData += '\n';
        } else {
          wineLabsData = `\n\nWine Labs API: No match found for "${wineToSearch}". You may want to use web search instead.\n`;
        }
      } catch (error) {
        console.error('[Chat] Error querying Wine Labs API:', error);
        wineLabsData = `\n\nWine Labs API: Error querying API. Falling back to web search.\n`;
      }
    }
  }

  // Build context about the wine
  let wineContext = '';
  if (wine) {
    wineContext = `\n\nWine Information:
- Name: ${wine.displayName}
${wine.vintage ? `- Vintage: ${wine.vintage}` : ''}
${wine.varietal ? `- Varietal: ${wine.varietal}` : ''}
${wine.region ? `- Region: ${wine.region}` : ''}
${wine.restaurantPrice ? `- Restaurant Price: $${wine.restaurantPrice}` : ''}
${wine.realPrice ? `- Market Price: $${wine.realPrice}` : ''}
${wine.markup !== undefined ? `- Markup: ${wine.markup}%` : ''}
${wine.criticScore ? `- Critic Score: ${wine.criticScore}/100${wine.criticCount ? ` (average across ${wine.criticCount} critics)` : ''}` : ''}
${wine.critic ? `- Top Critic: ${wine.critic}` : ''}`;
  }

  // Build conversation history
  const conversationHistory = history
    .slice(-10) // Last 10 messages for context
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are a helpful wine expert assistant. You help users understand wines, make recommendations, and answer questions about wine pairings, tasting notes, and wine selection.

You have access to:
1. Wine Labs API - Professional wine database with accurate pricing, critic scores, and wine information. Use this when users ask about specific wines, prices, or critic scores.
2. Web search - For current wine information, prices, and reviews when Wine Labs doesn't have the data.

When users ask about a specific wine, try to use Wine Labs API data first (if available), then supplement with web search if needed.

${wineContext}
${wineLabsData}

${imageUrl ? `\nThe user has shared a wine list image. You can reference it in your responses.` : ''}

Be conversational, knowledgeable, and helpful. Keep responses concise but informative.`;

  const prompt = `${systemPrompt}\n\nConversation History:\n${conversationHistory}\n\nUser: ${userMessage}\nAssistant:`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
                ...(imageUrl
                  ? [
                      {
                        inlineData: {
                          mimeType: 'image/jpeg',
                          data: await imageToBase64(imageUrl),
                        },
                      },
                    ]
                  : []),
              ],
            },
          ],
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I encountered an error processing your request.';

    return content;
  } catch (error) {
    console.error('Error getting AI response:', error);
    throw error;
  }
}

/**
 * Convert image URL to base64
 */
async function imageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

/**
 * Update a conversation
 */
export async function updateChatConversation(
  conversationId: string,
  updates: { imageUrl?: string }
): Promise<ChatConversation> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  const updateData: any = {};
  if (updates.imageUrl !== undefined) {
    updateData.image_url = updates.imageUrl;
  }

  const { data, error } = await supabase
    .from('chat_conversations')
    .update(updateData)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    wineId: data.wine_id,
    scanId: data.scan_id,
    imageUrl: data.image_url,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Upload image to Supabase Storage (optional - fails gracefully)
 */
export async function uploadImageToStorage(imageUri: string): Promise<string | null> {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      console.warn('[Chat] User not authenticated, skipping image upload');
      return null;
    }

    const userId = session.session.user.id;

    // Check if bucket exists first
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('[Chat] Error checking buckets:', bucketError);
      return null;
    }

    const wineListsBucket = buckets?.find(b => b.id === 'wine-lists');
    if (!wineListsBucket) {
      console.warn('[Chat] Storage bucket "wine-lists" does not exist');
      return null;
    }

    // Detect image type from URI or blob
    let fileExtension = 'jpg';
    let contentType = 'image/jpeg';

    // Fetch the image and convert to Blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Determine content type from blob or URI
    if (blob.type) {
      contentType = blob.type;
      if (blob.type === 'image/png') {
        fileExtension = 'png';
      } else if (blob.type === 'image/heic') {
        fileExtension = 'heic';
      } else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
        fileExtension = 'jpg';
      }
    } else if (imageUri.toLowerCase().includes('.png')) {
      contentType = 'image/png';
      fileExtension = 'png';
    } else if (imageUri.toLowerCase().includes('.heic')) {
      contentType = 'image/heic';
      fileExtension = 'heic';
    }

    const fileName = `${userId}/${Date.now()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from('wine-lists')
      .upload(fileName, blob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.warn('[Chat] Storage upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('wine-lists')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.warn('[Chat] Error uploading image to storage:', error);
    return null;
  }
}

/**
 * Delete a conversation
 */
export async function deleteChatConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    throw error;
  }
}

/**
 * Generate a chat title using AI based on first message or wine list
 */
export async function generateChatTitle(
  conversationId: string,
  firstMessage?: string,
  wines?: Wine[]
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'New Chat';
  }

  let prompt = 'Generate a short, descriptive title (max 50 characters) for this wine chat conversation. ';
  
  if (wines && wines.length > 0) {
    const wineNames = wines.slice(0, 3).map(w => w.displayName).join(', ');
    prompt += `The conversation is about analyzing a wine list with: ${wineNames}${wines.length > 3 ? ' and more' : ''}.`;
  } else if (firstMessage) {
    prompt += `The first user message is: "${firstMessage.substring(0, 200)}"`;
  } else {
    return 'New Chat';
  }

  prompt += '\n\nReturn ONLY the title text, no quotes, no explanation. Keep it under 50 characters.';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 50,
          },
        }),
      }
    );

    if (!response.ok) {
      return 'New Chat';
    }

    const data = await response.json();
    const title = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'New Chat';
    
    // Ensure title is max 50 chars
    const finalTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
    
    // Update conversation title
    await supabase
      .from('chat_conversations')
      .update({ title: finalTitle })
      .eq('id', conversationId);

    return finalTitle;
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'New Chat';
  }
}

/**
 * Add an assistant message with optional metadata (for wine list analysis)
 */
export async function addAssistantMessage(
  conversationId: string,
  content: string,
  metadata?: { wines?: Wine[]; imageUrl?: string }
): Promise<ChatMessage> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user) {
    throw new Error('User not authenticated');
  }

  // Store metadata as JSON in a custom field if needed
  // For now, we'll store wines data separately and reference via imageUrl
  const { data: assistantMessage, error } = await supabase
    .from('chat_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: content,
      image_url: metadata?.imageUrl,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return {
    id: assistantMessage.id,
    conversationId: assistantMessage.conversation_id,
    role: assistantMessage.role,
    content: assistantMessage.content,
    imageUrl: assistantMessage.image_url,
    createdAt: assistantMessage.created_at,
  };
}


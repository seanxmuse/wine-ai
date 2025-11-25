import type { WineListItem } from '../types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

/**
 * Parse wine list image using LLM vision model
 * Supports Google Gemini, OpenAI GPT-4 Vision, or Anthropic Claude with vision
 */
export async function parseWineListImage(
  imageUri: string
): Promise<WineListItem[]> {
  // Try Gemini first if key is available (best cost/performance)
  if (GEMINI_API_KEY) {
    return parseWithGemini(imageUri);
  }

  // Fall back to OpenAI if available
  if (OPENAI_API_KEY) {
    return parseWithOpenAI(imageUri);
  }

  // Fall back to Anthropic if available
  if (ANTHROPIC_API_KEY) {
    return parseWithAnthropic(imageUri);
  }

  throw new Error('No vision API key configured. Please set EXPO_PUBLIC_GEMINI_API_KEY, EXPO_PUBLIC_OPENAI_API_KEY, or EXPO_PUBLIC_ANTHROPIC_API_KEY');
}

async function parseWithGemini(imageUri: string): Promise<WineListItem[]> {
  try {
    console.log('[VISION] Starting Gemini parsing for image:', imageUri);

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    console.log('[VISION] Image converted to base64, length:', base64Image.length);

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
                  text: `Extract all wines from this wine list. Return ONLY a JSON array, no markdown.

Rules:
- Full producer name (e.g., "Château Margaux" not "Ch. Margaux")
- Include vintage if visible (e.g., "2015")
- Price as number only (e.g., 450 not "$450")
- Each wine: {"wineName": "Full Name", "vintage": "2015", "price": 450}
- Skip wines with unclear prices
- Only 80%+ confidence items

Example: [{"wineName": "Château Margaux", "vintage": "2015", "price": 450}]`,
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192, // Support large wine lists (hundreds of wines)
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[VISION] Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('[VISION] Gemini raw response:', JSON.stringify(data, null, 2));

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    console.log('[VISION] Extracted content:', content);

    // Clean up response - remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    console.log('[VISION] Cleaned content:', cleanedContent);

    // Parse JSON from response
    const wines = JSON.parse(cleanedContent);
    console.log('[VISION] Parsed wines:', wines);

    const result = wines.map((wine: any) => ({
      rawText: `${wine.wineName} ${wine.vintage || ''} $${wine.price}`.trim(),
      wineName: wine.wineName,
      vintage: wine.vintage,
      price: parseFloat(wine.price),
      confidence: 0.9,
    }));
    console.log('[VISION] Final result:', result);
    return result;
  } catch (error) {
    console.error('[VISION] Error parsing with Gemini:', error);
    throw error;
  }
}

async function parseWithOpenAI(imageUri: string): Promise<WineListItem[]> {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a wine list parser. Extract all wines from this wine list image and return them as a JSON array. For each wine, extract:
- wineName (full wine name including producer)
- vintage (year, if visible)
- price (numeric value only)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {"wineName": "Château Margaux", "vintage": "2015", "price": 450},
  {"wineName": "Domaine de la Romanée-Conti", "vintage": "2018", "price": 1200}
]

If you cannot clearly read a wine's information, skip it. Only include wines you can confidently parse.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON from response
    const wines = JSON.parse(content);
    return wines.map((wine: any) => ({
      rawText: `${wine.wineName} ${wine.vintage || ''} $${wine.price}`.trim(),
      wineName: wine.wineName,
      vintage: wine.vintage,
      price: parseFloat(wine.price),
      confidence: 0.9,
    }));
  } catch (error) {
    console.error('Error parsing with OpenAI:', error);
    throw error;
  }
}

async function parseWithAnthropic(imageUri: string): Promise<WineListItem[]> {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: `You are a wine list parser. Extract all wines from this wine list image and return them as a JSON array. For each wine, extract:
- wineName (full wine name including producer)
- vintage (year, if visible)
- price (numeric value only)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {"wineName": "Château Margaux", "vintage": "2015", "price": 450},
  {"wineName": "Domaine de la Romanée-Conti", "vintage": "2018", "price": 1200}
]

If you cannot clearly read a wine's information, skip it. Only include wines you can confidently parse.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '[]';

    // Parse JSON from response
    const wines = JSON.parse(content);
    return wines.map((wine: any) => ({
      rawText: `${wine.wineName} ${wine.vintage || ''} $${wine.price}`.trim(),
      wineName: wine.wineName,
      vintage: wine.vintage,
      price: parseFloat(wine.price),
      confidence: 0.9,
    }));
  } catch (error) {
    console.error('Error parsing with Anthropic:', error);
    throw error;
  }
}

async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix
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

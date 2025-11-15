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
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: `You are an expert wine list parser. Extract ALL wines from this restaurant wine list image.

CRITICAL INSTRUCTIONS:
1. Extract the FULL producer name (e.g., "Château Margaux" not "Margaux")
2. Include vintage year if visible (4-digit year like "2015" or "2018")
3. Extract numeric price ONLY (no currency symbols, commas, or decimals)
4. Preserve proper wine name spelling (don't abbreviate "Château" to "Ch" or "Domaine" to "Dom")
5. Keep accented characters (é, è, ô, etc.) when visible

FORMAT RULES:
- Return ONLY valid JSON array (no markdown, no code blocks, no explanatory text)
- Each wine must have: wineName, vintage (optional), price
- wineName should be the complete producer + wine name
- Vintage should be a string (e.g., "2015" or null if not visible)
- Price should be a number (e.g., 450 not "450" or "$450")

EXAMPLES:
[
  {"wineName": "Château Margaux", "vintage": "2015", "price": 450},
  {"wineName": "Domaine de la Romanée-Conti La Tâche", "vintage": "2018", "price": 1200},
  {"wineName": "Penfolds Grange", "vintage": "2016", "price": 680}
]

QUALITY CONTROL:
- Only include wines you can read with 80%+ confidence
- If vintage is unclear, omit it (don't guess)
- If price is unclear, skip that wine entirely
- Don't invent or hallucinate wine names`,
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
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

    // Clean up response - remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON from response
    const wines = JSON.parse(cleanedContent);
    return wines.map((wine: any) => ({
      rawText: `${wine.wineName} ${wine.vintage || ''} $${wine.price}`.trim(),
      wineName: wine.wineName,
      vintage: wine.vintage,
      price: parseFloat(wine.price),
      confidence: 0.9,
    }));
  } catch (error) {
    console.error('Error parsing with Gemini:', error);
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

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

MANDATORY RULE - VARIETAL MUST BE INCLUDED:
- Look at the menu carefully. If you see a varietal listed (Pinot Noir, Cabernet Sauvignon, Chardonnay, etc.), it MUST be part of the wineName
- Even if the varietal appears on a separate line or column, combine it with the wine name
- wineName format: "Producer WineName Varietal" when varietal is visible
  ✅ CORRECT: "Roco Gravel Road Pinot Noir" (varietal included)
  ✅ CORRECT: "La Crema Pinot Noir" (varietal included)  
  ✅ CORRECT: "Elouan Pinot Noir" (varietal included)
  ❌ WRONG: "Roco Gravel Road" (missing varietal - REJECT THIS)
  ❌ WRONG: "Elouan" (missing varietal - REJECT THIS)
- Only Bordeaux/European wines may omit varietal (they don't list it)
- Include vintage if visible (e.g., "2015")
- Price as number only (e.g., 64 not "$64")
- Each wine: {"wineName": "Full Name Including Varietal", "vintage": "2022", "price": 64}
- DO NOT return wines with incomplete names missing visible varietals

REQUIRED EXAMPLES FORMAT:
[{"wineName": "Roco Gravel Road Pinot Noir", "vintage": "2022", "price": 64}]
[{"wineName": "La Crema Pinot Noir", "vintage": null, "price": 60}]
[{"wineName": "Elouan Pinot Noir", "vintage": null, "price": 48}]`,
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

    // Common varietals that should be included if visible on menu
    const commonVarietals = [
      'Pinot Noir', 'Cabernet Sauvignon', 'Chardonnay', 'Sauvignon Blanc',
      'Merlot', 'Riesling', 'Syrah', 'Shiraz', 'Pinot Grigio', 'Pinot Gris',
      'Malbec', 'Zinfandel', 'Sangiovese', 'Tempranillo', 'Gewürztraminer',
      'Viognier', 'Grenache', 'Mourvèdre', 'Nebbiolo', 'Barbera'
    ];

    // Validate and warn about incomplete wine names
    const validatedWines = wines.map((wine: any) => {
      const wineName = wine.wineName || '';
      const hasVarietal = commonVarietals.some(varietal => 
        wineName.toLowerCase().includes(varietal.toLowerCase())
      );
      
      // Check if name looks incomplete (short names without varietal)
      const isShortName = wineName.split(' ').length <= 2;
      const isLikelyIncomplete = isShortName && !hasVarietal && 
        !wineName.toLowerCase().includes('château') &&
        !wineName.toLowerCase().includes('domaine');
      
      if (isLikelyIncomplete) {
        console.warn(`[VISION] ⚠️ Potentially incomplete wine name: "${wineName}" - may be missing varietal`);
      }
      
      return {
        rawText: `${wineName} ${wine.vintage || ''} $${wine.price}`.trim(),
        wineName: wineName,
        vintage: wine.vintage,
        price: parseFloat(wine.price),
        confidence: isLikelyIncomplete ? 0.7 : 0.9, // Lower confidence for incomplete names
      };
    });

    console.log('[VISION] Final result:', validatedWines);
    return validatedWines;
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
                text: `You are a wine list parser. Extract all wines from this wine list image and return them as a JSON array.

CRITICAL: wineName MUST include the complete wine name including varietal when visible:
- ✅ "Roco Gravel Road Pinot Noir" (varietal included)
- ✅ "La Crema Pinot Noir" (varietal included)
- ❌ "Roco Gravel Road" (missing varietal - INCOMPLETE)
- ❌ "La Crema" (missing varietal - INCOMPLETE)

For each wine, extract:
- wineName (complete name: producer + wine name + varietal when visible)
- vintage (year, if visible)
- price (numeric value only)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {"wineName": "Roco Gravel Road Pinot Noir", "vintage": "2022", "price": 64},
  {"wineName": "La Crema Pinot Noir", "vintage": null, "price": 60},
  {"wineName": "Château Margaux", "vintage": "2015", "price": 450}
]

If varietal is shown on the menu, it MUST be included in wineName. Skip wines with unclear prices or incomplete names.`,
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
                text: `You are a wine list parser. Extract all wines from this wine list image and return them as a JSON array.

CRITICAL: wineName MUST include the complete wine name including varietal when visible:
- ✅ "Roco Gravel Road Pinot Noir" (varietal included)
- ✅ "La Crema Pinot Noir" (varietal included)
- ❌ "Roco Gravel Road" (missing varietal - INCOMPLETE)
- ❌ "La Crema" (missing varietal - INCOMPLETE)

For each wine, extract:
- wineName (complete name: producer + wine name + varietal when visible)
- vintage (year, if visible)
- price (numeric value only)

Return ONLY a valid JSON array with no additional text. Example format:
[
  {"wineName": "Roco Gravel Road Pinot Noir", "vintage": "2022", "price": 64},
  {"wineName": "La Crema Pinot Noir", "vintage": null, "price": 60},
  {"wineName": "Château Margaux", "vintage": "2015", "price": 450}
]

If varietal is shown on the menu, it MUST be included in wineName. Skip wines with unclear prices or incomplete names.`,
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

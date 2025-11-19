/**
 * Web Search service for wine information fallback
 * Uses Gemini API with Google Search grounding via direct HTTP calls
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface WebSearchWineResult {
  wineName: string;
  vintage?: string;
  varietal?: string;
  region?: string;
  averagePrice?: number;
  priceSource?: string;
  confidence: number;
  dataSource: 'web-search';
  searchError?: string;
}

export interface WebSearchCriticScore {
  critic: string;
  score: number;
  source?: string;
  vintage?: string;
}

/**
 * Search for wine information on the web using Gemini with Google Search grounding
 * Uses direct HTTP API call (same pattern as vision.ts)
 * @param wineName - The wine name to search for
 * @param vintage - Optional vintage year
 * @returns Wine information extracted from web search results
 */
export async function searchWineOnWeb(
  wineName: string,
  vintage?: string
): Promise<WebSearchWineResult> {
  try {
    console.log(`[WebSearch] Searching for: ${wineName} ${vintage || ''}`);

    if (!GEMINI_API_KEY) {
      console.error('[WebSearch] No Gemini API key configured');
      return {
        wineName: wineName,
        vintage: vintage,
        confidence: 0,
        dataSource: 'web-search',
        searchError: 'No API key configured',
      };
    }

    const searchQuery = vintage ? `${wineName} ${vintage}` : wineName;

    // More concise prompt to reduce token usage
    const prompt = `Find "${searchQuery}" wine info. Return JSON only:
{
  "wineName": "official name",
  "vintage": "year or null",
  "varietal": "grape type or null",
  "region": "appellation or null",
  "averagePrice": number or null,
  "priceSource": "source name or null",
  "confidence": 0-100
}
If not found, set confidence to 0.`;

    // Use Gemini 2.5 Flash with Google Search grounding
    // Note: The tools parameter enables Google Search
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
              ],
            },
          ],
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 8192, // Increased to 8k to allow for internal reasoning with Google Search
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WebSearch] Gemini API error:', errorData);

      return {
        wineName: wineName,
        vintage: vintage,
        confidence: 0,
        dataSource: 'web-search',
        searchError: `API error: ${response.statusText}`,
      };
    }

    const data = await response.json();
    console.log('[WebSearch] Gemini raw response:', JSON.stringify(data, null, 2));

    // Check if response was truncated
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      console.warn('[WebSearch] Response truncated due to MAX_TOKENS limit');
      // Try to extract partial information from grounding metadata if available
      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
        console.log('[WebSearch] Search was performed but response was truncated');
        // Return low confidence result with original name
        return {
          wineName: wineName,
          vintage: vintage,
          confidence: 20, // Low confidence since we couldn't get full response
          dataSource: 'web-search',
          searchError: 'Response truncated - partial match only',
        };
      }
    }

    // Extract text from Gemini response
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      '';

    if (!text) {
      console.error('[WebSearch] No text in response');
      // Check if search was performed (grounding metadata exists)
      const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
        console.log('[WebSearch] Search performed but no text returned - may be truncated');
        return {
          wineName: wineName,
          vintage: vintage,
          confidence: 15, // Very low confidence
          dataSource: 'web-search',
          searchError: 'Search performed but response incomplete',
        };
      }
      
      return {
        wineName: wineName,
        vintage: vintage,
        confidence: 0,
        dataSource: 'web-search',
        searchError: 'Empty response from API',
      };
    }

    console.log('[WebSearch] Extracted text:', text);

    // Parse the JSON response
    let parsedData;
    try {
      // Try to extract JSON from the response (in case there's markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[WebSearch] Failed to parse JSON response:', parseError);
      console.error('[WebSearch] Text was:', text);
      return {
        wineName: wineName,
        vintage: vintage,
        confidence: 0,
        dataSource: 'web-search',
        searchError: 'Failed to parse search results',
      };
    }

    // Validate and normalize the data
    const webSearchResult: WebSearchWineResult = {
      wineName: parsedData.wineName || wineName,
      vintage: parsedData.vintage || vintage,
      varietal: parsedData.varietal || undefined,
      region: parsedData.region || undefined,
      averagePrice: parsedData.averagePrice ? parseFloat(parsedData.averagePrice) : undefined,
      priceSource: parsedData.priceSource || 'web search',
      confidence: Math.min(100, Math.max(0, parsedData.confidence || 0)),
      dataSource: 'web-search',
    };

    console.log('[WebSearch] Extracted data:', webSearchResult);

    return webSearchResult;
  } catch (error: any) {
    console.error('[WebSearch] Error searching for wine:', error);
    return {
      wineName: wineName,
      vintage: vintage,
      confidence: 0,
      dataSource: 'web-search',
      searchError: error.message || 'Unknown error',
    };
  }
}

/**
 * Search for multiple wines in parallel
 * @param wines - Array of {name, vintage} objects
 * @returns Array of web search results
 */
export async function searchMultipleWinesOnWeb(
  wines: Array<{ name: string; vintage?: string }>
): Promise<WebSearchWineResult[]> {
  console.log(`[WebSearch] Searching for ${wines.length} wines`);

  // Process in parallel with Promise.all
  const results = await Promise.all(
    wines.map((wine) => searchWineOnWeb(wine.name, wine.vintage))
  );

  const successCount = results.filter((r) => r.confidence > 50).length;
  console.log(
    `[WebSearch] Completed: ${successCount}/${wines.length} wines found with good confidence`
  );

  return results;
}

/**
 * Search for critic scores for a wine using web search
 * Fallback when WineLabs doesn't have scores
 * @param wineName - The wine name to search for
 * @param vintage - Optional vintage year
 * @returns Array of critic scores from web search
 */
export async function searchCriticScoresOnWeb(
  wineName: string,
  vintage?: string
): Promise<WebSearchCriticScore[]> {
  try {
    console.log(`[WebSearch] Searching for critic scores: ${wineName} ${vintage || ''}`);

    if (!GEMINI_API_KEY) {
      console.error('[WebSearch] No Gemini API key configured');
      return [];
    }

    const searchQuery = vintage ? `${wineName} ${vintage}` : wineName;

    const prompt = `Find critic scores and ratings for "${searchQuery}" wine. Search Wine Spectator, Robert Parker, Wine Enthusiast, Decanter, James Suckling, and other wine critics. Return JSON array only:
[
  {
    "critic": "critic name (e.g., 'Robert Parker', 'Wine Spectator')",
    "score": number (0-100 scale),
    "source": "publication name",
    "vintage": "year or null"
  }
]
If no scores found, return empty array []. Only include scores from reputable wine critics/publications.`;

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
              ],
            },
          ],
          tools: [
            {
              googleSearch: {},
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WebSearch] Critic scores API error:', errorData);
      return [];
    }

    const data = await response.json();
    console.log('[WebSearch] Critic scores raw response:', JSON.stringify(data).substring(0, 500));

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      console.log('[WebSearch] No critic scores found in response');
      return [];
    }

    console.log('[WebSearch] Extracted critic scores text:', text);

    // Parse the JSON response
    let parsedData;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('[WebSearch] Failed to parse critic scores JSON:', parseError);
      console.error('[WebSearch] Text was:', text);
      return [];
    }

    // Validate and normalize the scores
    if (!Array.isArray(parsedData)) {
      console.warn('[WebSearch] Critic scores response is not an array:', parsedData);
      return [];
    }

    const scores: WebSearchCriticScore[] = parsedData
      .filter((item: any) => item.critic && typeof item.score === 'number' && item.score > 0)
      .map((item: any) => ({
        critic: item.critic,
        score: Math.min(100, Math.max(0, item.score)), // Clamp to 0-100
        source: item.source,
        vintage: item.vintage || vintage,
      }));

    console.log(`[WebSearch] Found ${scores.length} critic scores from web search`);
    if (scores.length > 0) {
      console.log('[WebSearch] Sample score:', JSON.stringify(scores[0]));
    }

    return scores;
  } catch (error: any) {
    console.error('[WebSearch] Error searching for critic scores:', error);
    return [];
  }
}

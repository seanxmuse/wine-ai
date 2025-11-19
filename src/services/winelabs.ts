import type {
  WineLabsMatchResponse,
  WineLabsPriceStats,
  WineLabsCriticScore,
  WineLabsWineInfo,
} from '../types';
import { searchMultipleWinesOnWeb } from './webSearch';

// Use GCP Cloud Function proxy to avoid CORS issues
// Note: Direct calls to external-api.wine-labs.com work but may have CORS restrictions
const USE_GCP_PROXY = true;
const WINELABS_PROXY = USE_GCP_PROXY
  ? 'https://winelabs-proxy-dlfk6dpu3q-uc.a.run.app'
  : 'https://external-api.wine-labs.com';

/**
 * Preprocess wine query to improve matching success rate
 * Handles common OCR errors and format variations
 */
function preprocessWineQuery(query: string): string {
  let cleaned = query.trim();

  // Common OCR corrections
  cleaned = cleaned
    // Fix common character confusions
    .replace(/[''`]/g, "'")              // Normalize quotes
    .replace(/[""]/g, '"')               // Normalize double quotes
    .replace(/\b0\b/g, 'O')              // 0 → O in wine names
    .replace(/\bl\b/gi, 'I')             // l → I

    // Common wine term corrections
    .replace(/\bCh\b\.?/gi, 'Château')   // Ch. → Château
    .replace(/\bDom\b\.?/gi, 'Domaine')  // Dom. → Domaine
    .replace(/\bSt\b\.?/gi, 'Saint')     // St. → Saint

    // Remove common noise
    .replace(/\$/g, '')                   // Remove $ signs
    .replace(/\s+/g, ' ')                 // Normalize whitespace
    .replace(/[•·]/g, '')                 // Remove bullet points
    .trim();

  return cleaned;
}

/**
 * Calculate confidence score based on match quality
 * Since Wine Labs doesn't provide confidence, we estimate it
 */
function calculateMatchConfidence(
  originalQuery: string,
  matchedName: string | undefined
): number {
  if (!matchedName) return 0;

  const query = originalQuery.toLowerCase().trim();
  const match = matchedName.toLowerCase().trim();

  // Exact match = 100%
  if (query === match) return 1.0;

  // Check if matched name contains key parts of query
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  const matchWords = match.split(/\s+/);

  let matchedWords = 0;
  for (const word of queryWords) {
    if (matchWords.some(mw => mw.includes(word) || word.includes(mw))) {
      matchedWords++;
    }
  }

  const wordMatchRatio = queryWords.length > 0
    ? matchedWords / queryWords.length
    : 0;

  // Confidence based on word overlap
  if (wordMatchRatio >= 0.8) return 0.9;  // Very high confidence
  if (wordMatchRatio >= 0.6) return 0.75; // High confidence
  if (wordMatchRatio >= 0.4) return 0.6;  // Medium confidence
  return 0.4; // Low confidence (but still matched)
}

// Match wine queries to LWIN identifiers (batch)
export async function matchWinesToLwin(
  queries: string[]
): Promise<WineLabsMatchResponse[]> {
  try {
    // Preprocess queries to improve matching
    const preprocessedQueries = queries.map(preprocessWineQuery);

    console.log('Original queries:', queries);
    console.log('Preprocessed queries:', preprocessedQueries);

    // Process in chunks of 20 to avoid timeout (60s GCP limit)
    const CHUNK_SIZE = 20;
    const allResults: any[] = [];

    for (let i = 0; i < preprocessedQueries.length; i += CHUNK_SIZE) {
      const chunk = preprocessedQueries.slice(i, i + CHUNK_SIZE);
      console.log(`Processing wines ${i + 1}-${Math.min(i + CHUNK_SIZE, preprocessedQueries.length)} of ${preprocessedQueries.length}`);

      const response = await fetch(WINELABS_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: 'match_to_lwin_batch',
          body: {
            queries: chunk,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WineLabs] API error ${response.status}:`, errorText);
        throw new Error(`Wine Labs API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      console.log(`[WineLabs] Raw API response:`, JSON.stringify(data).substring(0, 500));
      
      // Handle response structure: API returns {results: [...]} or just [...]
      let results: any[] = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
      } else if (data.results === null || data.results === undefined) {
        // Empty results - API returned valid response but no matches
        console.warn(`[WineLabs] API returned empty results for chunk`);
        results = [];
      } else {
        console.error(`[WineLabs] Unexpected response structure:`, data);
        throw new Error(`Unexpected API response structure: expected array or {results: array}`);
      }
      
      console.log(`[WineLabs] Parsed ${results.length} results from chunk`);
      allResults.push(...results);
    }

    // Ensure we have the same number of results as queries
    if (allResults.length !== queries.length) {
      console.warn(`[WineLabs] Result count mismatch: ${allResults.length} results for ${queries.length} queries`);
      // Pad with empty results if needed
      while (allResults.length < queries.length) {
        allResults.push({});
      }
    }

    // Enhance response with match status and confidence scores
    const enhancedResults = allResults.map((match: any, index: number) => {
      const hasMatch = !!(match?.lwin || match?.lwin7);
      const confidence = calculateMatchConfidence(
        queries[index],
        match?.display_name
      );

      console.log(`Match result for "${queries[index]}":`, {
        matched: hasMatch,
        display_name: match?.display_name,
        confidence,
      });

      return {
        ...match,
        matched: hasMatch,
        confidence: hasMatch ? confidence : 0,
        originalQuery: queries[index],
      };
    });

    // Identify unmatched wines for web search fallback
    const unmatchedIndices = enhancedResults
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => !result.matched)
      .map(({ index }) => index);

    const matchedCount = enhancedResults.length - unmatchedIndices.length;
    console.log(`[WineLabs] Matched ${matchedCount}/${enhancedResults.length} wines`);

    // If there are unmatched wines, try web search fallback
    if (unmatchedIndices.length > 0) {
      console.log(`[WineLabs] Attempting web search for ${unmatchedIndices.length} unmatched wines...`);

      try {
        const unmatchedWines = unmatchedIndices.map(index => ({
          name: queries[index],
          vintage: undefined, // Could extract vintage from query if needed
        }));

        const webSearchResults = await searchMultipleWinesOnWeb(unmatchedWines);

        // Merge web search results back into enhanced results
        unmatchedIndices.forEach((originalIndex, searchIndex) => {
          const webResult = webSearchResults[searchIndex];

          // Only use web search result if confidence is reasonable (>30)
          if (webResult.confidence > 30) {
            console.log(`[WineLabs] Web search found: ${webResult.wineName} (confidence: ${webResult.confidence})`);

            enhancedResults[originalIndex] = {
              ...enhancedResults[originalIndex],
              display_name: webResult.wineName,
              vintage: webResult.vintage,
              varietal: webResult.varietal,
              region: webResult.region,
              webSearchPrice: webResult.averagePrice,
              webSearchSource: webResult.priceSource,
              dataSource: 'web-search',
              matched: true, // Mark as matched via web search
              confidence: webResult.confidence,
            };
          }
        });

        const webMatchCount = webSearchResults.filter(r => r.confidence > 30).length;
        console.log(`[WineLabs] Web search matched ${webMatchCount}/${unmatchedIndices.length} additional wines`);
        console.log(`[WineLabs] Final stats: ${matchedCount + webMatchCount}/${enhancedResults.length} total matches`);
      } catch (webSearchError) {
        console.error('[WineLabs] Web search fallback failed:', webSearchError);
        // Continue with original results if web search fails
      }
    }

    return enhancedResults;
  } catch (error) {
    console.error('Error matching wines to LWIN:', error);
    throw error;
  }
}

// Get price statistics for a wine
export async function getPriceStats(
  query?: string,
  lwin?: string,
  region: string = 'world'
): Promise<WineLabsPriceStats> {
  try {
    const body: any = {
      region,
    };

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    const response = await fetch(WINELABS_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'price_stats',
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WineLabs] Price stats error ${response.status}:`, errorText);
      throw new Error(`Wine Labs API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log(`[WineLabs] Price stats response:`, JSON.stringify(data).substring(0, 300));
    
    // API returns {results: [{median_value, ...}]} - extract first result
    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
      const result = data.results[0];
      return {
        vintage: result.vintage,
        region: result.region || 'world',
        median: result.median_value || result.median,
        min: result.min,
        p25: result.p25,
        p75: result.p75,
        max: result.max,
        count: result.count || 0,
      };
    }
    
    // Fallback: return data as-is if structure is different
    return data;
  } catch (error) {
    console.error('Error fetching price stats:', error);
    throw error;
  }
}

// Get critic scores for a wine
export async function getCriticScores(
  query?: string,
  lwin?: string,
  vintage?: string
): Promise<WineLabsCriticScore[]> {
  try {
    const body: any = {};

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    // Only include vintage if it's a valid year (not null/undefined/empty)
    if (vintage && vintage !== 'null' && vintage.trim() !== '') {
      body.vintage = vintage;
    }

    const response = await fetch(WINELABS_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'critic_scores',
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WineLabs] Critic scores error ${response.status}:`, errorText);
      // Don't throw - return empty array for graceful degradation
      return [];
    }

    const data = await response.json();
    console.log(`[WineLabs] Critic scores raw response:`, JSON.stringify(data).substring(0, 500));
    
    // Handle different response structures
    let scores: any[] = [];
    
    if (Array.isArray(data)) {
      // Direct array response
      scores = data;
    } else if (data.results && Array.isArray(data.results)) {
      // Wrapped in results array (like price_stats)
      scores = data.results;
    } else if (data.scores && Array.isArray(data.scores)) {
      // Wrapped in scores array
      scores = data.scores;
    } else if (data.data && Array.isArray(data.data)) {
      // Wrapped in data array
      scores = data.data;
    } else {
      // Empty or unexpected structure
      console.warn(`[WineLabs] Unexpected critic scores response structure:`, data);
      scores = [];
    }
    
    console.log(`[WineLabs] Critic scores parsed: ${scores.length} scores`);
    if (scores.length > 0) {
      console.log(`[WineLabs] Sample score:`, JSON.stringify(scores[0]).substring(0, 200));
    }
    
    // Map API response to expected structure
    const mappedScores: WineLabsCriticScore[] = scores.map((s: any) => {
      // API returns review_score, we need score
      const score = s.review_score || s.score;
      // API returns critic_title, we need critic
      const critic = s.critic_title || s.critic || 'Unknown Critic';
      // API returns wine_vintage, we need vintage
      const vintage = s.wine_vintage || s.vintage;
      // Build drinking window from beg/end if available
      let drinkingWindow: string | undefined;
      if (s.beg_drink_window && s.end_drink_window) {
        drinkingWindow = `${s.beg_drink_window}-${s.end_drink_window}`;
      } else if (s.beg_drink_window) {
        drinkingWindow = `From ${s.beg_drink_window}`;
      } else if (s.end_drink_window) {
        drinkingWindow = `Until ${s.end_drink_window}`;
      }
      
      return {
        critic,
        score: typeof score === 'number' ? score : parseFloat(score) || 0,
        vintage: vintage ? String(vintage) : undefined,
        drinking_window: drinkingWindow,
      };
    }).filter((s: WineLabsCriticScore) => s.score > 0); // Filter out invalid scores
    
    console.log(`[WineLabs] Mapped ${mappedScores.length} valid critic scores`);
    if (mappedScores.length > 0) {
      console.log(`[WineLabs] Sample mapped score:`, mappedScores[0]);
    }
    
    return mappedScores;
  } catch (error) {
    console.error('Error fetching critic scores:', error);
    return [];
  }
}

// Get wine information
export async function getWineInfo(
  query?: string,
  lwin?: string
): Promise<WineLabsWineInfo | null> {
  try {
    const body: any = {};

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    const response = await fetch(WINELABS_PROXY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: 'wine_info',
        body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WineLabs] Wine info error ${response.status}:`, errorText);
      // Return null instead of throwing for graceful degradation
      return null;
    }

    const data = await response.json();
    console.log(`[WineLabs] Wine info response:`, JSON.stringify(data).substring(0, 300));
    return data;
  } catch (error) {
    console.error('Error fetching wine info:', error);
    return null;
  }
}

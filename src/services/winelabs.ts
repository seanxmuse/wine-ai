import type {
  WineLabsMatchResponse,
  WineLabsPriceStats,
  WineLabsCriticScore,
  WineLabsWineInfo,
} from '../types';

const WINELABS_API_BASE = 'https://winelabs.ai/api';
const API_KEY = process.env.EXPO_PUBLIC_WINELABS_API_KEY || '';
const USER_ID = process.env.EXPO_PUBLIC_WINELABS_USER_ID || '';

if (!API_KEY) {
  console.warn('Wine Labs API key not found');
}

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

    const response = await fetch(`${WINELABS_API_BASE}/match_to_lwin_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: USER_ID,
        queries: preprocessedQueries.slice(0, 100), // Max 100 per batch
      }),
    });

    if (!response.ok) {
      throw new Error(`Wine Labs API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Enhance response with match status and confidence scores
    return data.map((match: any, index: number) => {
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
      };
    });
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
      user_id: USER_ID,
      region,
    };

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    const response = await fetch(`${WINELABS_API_BASE}/price_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Wine Labs API error: ${response.statusText}`);
    }

    const data = await response.json();
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
    const body: any = {
      user_id: USER_ID,
    };

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    if (vintage) {
      body.vintage = vintage;
    }

    const response = await fetch(`${WINELABS_API_BASE}/critic_scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Wine Labs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
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
    const body: any = {
      user_id: USER_ID,
    };

    if (lwin) {
      body.lwin = lwin;
    } else if (query) {
      body.query = query;
    } else {
      throw new Error('Either query or lwin must be provided');
    }

    const response = await fetch(`${WINELABS_API_BASE}/wine_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Wine Labs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching wine info:', error);
    return null;
  }
}

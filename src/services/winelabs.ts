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

// Match wine queries to LWIN identifiers (batch)
export async function matchWinesToLwin(
  queries: string[]
): Promise<WineLabsMatchResponse[]> {
  try {
    const response = await fetch(`${WINELABS_API_BASE}/match_to_lwin_batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: USER_ID,
        queries: queries.slice(0, 100), // Max 100 per batch
      }),
    });

    if (!response.ok) {
      throw new Error(`Wine Labs API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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

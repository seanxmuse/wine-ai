import type { Wine, RankingResults } from '../types';

/**
 * Calculate wine rankings based on different criteria
 */
export function rankWines(wines: Wine[]): RankingResults {
  // Filter out wines without necessary data
  const validWines = wines.filter(wine => wine.restaurantPrice > 0);

  // Highest Rated: Sort by critic score (descending)
  const highestRated = [...validWines]
    .filter(wine => wine.criticScore && wine.criticScore > 0)
    .sort((a, b) => (b.criticScore || 0) - (a.criticScore || 0));

  // Most Inexpensive: Sort by restaurant price (ascending)
  const mostInexpensive = [...validWines]
    .sort((a, b) => a.restaurantPrice - b.restaurantPrice);

  // Best Value: Calculate value score (quality per dollar considering markup)
  const winesWithValue = validWines
    .filter(wine =>
      wine.criticScore &&
      wine.criticScore > 0 &&
      wine.realPrice &&
      wine.realPrice > 0 &&
      wine.markup !== undefined
    )
    .map(wine => {
      // Value formula: (Score / Restaurant Price) * (1 / (1 + Markup%/100))
      // This rewards high scores, low prices, and low markups
      const markupFactor = 1 / (1 + (wine.markup || 0) / 100);
      const priceEfficiency = (wine.criticScore || 0) / wine.restaurantPrice;
      const valueScore = priceEfficiency * markupFactor;

      return {
        ...wine,
        valueScore,
      };
    })
    .sort((a, b) => b.valueScore - a.valueScore);

  const bestValue = winesWithValue.map(({ valueScore, ...wine }) => wine);

  return {
    highestRated,
    bestValue,
    mostInexpensive,
  };
}

/**
 * Calculate markup percentage
 */
export function calculateMarkup(restaurantPrice: number, realPrice: number): number {
  if (realPrice <= 0) return 0;
  return ((restaurantPrice - realPrice) / realPrice) * 100;
}

/**
 * Get markup color based on percentage
 * Green: < 100% markup (reasonable)
 * Yellow: 100-200% markup (moderate)
 * Red: > 200% markup (high)
 */
export function getMarkupColor(markup: number): string {
  if (markup < 100) return '#2d5f2d'; // Green
  if (markup < 200) return '#d4af37'; // Gold/Yellow
  return '#8b3952'; // Burgundy/Red
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Format markup for display
 */
export function formatMarkup(markup: number): string {
  return `${markup.toFixed(0)}%`;
}

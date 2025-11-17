import type { Wine } from '../types';

/**
 * Sample wine data for debugging UI without wasting API credits
 * Represents a typical high-end restaurant wine list
 */
export const SAMPLE_WINES: Wine[] = [
  // High-end Bordeaux with excellent scores
  {
    lwin: '1012781',
    lwin7: '1012781',
    displayName: 'Château Margaux, Premier Grand Cru Classé',
    vintage: '2015',
    restaurantPrice: 850,
    realPrice: 425,
    markup: 100,
    criticScore: 98,
    critic: 'Robert Parker',
    varietal: 'Cabernet Sauvignon Blend',
    region: 'Margaux, Bordeaux',
    color: 'Red',
  },

  // California cult wine - high price, high markup
  {
    lwin: '1047329',
    lwin7: '1047329',
    displayName: 'Screaming Eagle Cabernet Sauvignon',
    vintage: '2018',
    restaurantPrice: 3500,
    realPrice: 1200,
    markup: 192,
    criticScore: 100,
    critic: 'Antonio Galloni',
    varietal: 'Cabernet Sauvignon',
    region: 'Napa Valley, California',
    color: 'Red',
  },

  // Premium Burgundy - reasonable markup
  {
    lwin: '1003443',
    lwin7: '1003443',
    displayName: 'Domaine de la Romanée-Conti, La Tâche Grand Cru',
    vintage: '2017',
    restaurantPrice: 4200,
    realPrice: 2800,
    markup: 50,
    criticScore: 97,
    critic: 'Jancis Robinson',
    varietal: 'Pinot Noir',
    region: 'Vosne-Romanée, Burgundy',
    color: 'Red',
  },

  // Value wine - low price, good score
  {
    lwin: '1089234',
    lwin7: '1089234',
    displayName: 'Catena Zapata Malbec Argentino',
    vintage: '2019',
    restaurantPrice: 68,
    realPrice: 42,
    markup: 62,
    criticScore: 94,
    critic: 'Wine Spectator',
    varietal: 'Malbec',
    region: 'Mendoza, Argentina',
    color: 'Red',
  },

  // Super Tuscan - high score, reasonable price
  {
    lwin: '1067432',
    lwin7: '1067432',
    displayName: 'Tenuta San Guido Sassicaia',
    vintage: '2016',
    restaurantPrice: 285,
    realPrice: 165,
    markup: 73,
    criticScore: 96,
    critic: 'James Suckling',
    varietal: 'Cabernet Sauvignon',
    region: 'Bolgheri, Tuscany',
    color: 'Red',
  },

  // Premium white - Burgundy
  {
    lwin: '1034521',
    lwin7: '1034521',
    displayName: 'Domaine Leflaive Bâtard-Montrachet Grand Cru',
    vintage: '2018',
    restaurantPrice: 520,
    realPrice: 380,
    markup: 37,
    criticScore: 95,
    critic: 'Vinous',
    varietal: 'Chardonnay',
    region: 'Puligny-Montrachet, Burgundy',
    color: 'White',
  },

  // California Chardonnay - value option
  {
    lwin: '1078234',
    lwin7: '1078234',
    displayName: 'Kistler Vineyards Chardonnay',
    vintage: '2020',
    restaurantPrice: 95,
    realPrice: 58,
    markup: 64,
    criticScore: 93,
    critic: 'Wine Advocate',
    varietal: 'Chardonnay',
    region: 'Sonoma Coast, California',
    color: 'White',
  },

  // Champagne - premium, low markup
  {
    lwin: '1012456',
    lwin7: '1012456',
    displayName: 'Dom Pérignon Vintage Brut',
    vintage: '2012',
    restaurantPrice: 350,
    realPrice: 220,
    markup: 59,
    criticScore: 96,
    critic: 'Wine Enthusiast',
    varietal: 'Chardonnay/Pinot Noir',
    region: 'Champagne, France',
    color: 'White',
  },

  // Value Bordeaux - affordable option
  {
    lwin: '1045678',
    lwin7: '1045678',
    displayName: 'Château Lynch-Bages, Pauillac',
    vintage: '2014',
    restaurantPrice: 140,
    realPrice: 85,
    markup: 65,
    criticScore: 92,
    critic: 'Robert Parker',
    varietal: 'Cabernet Sauvignon Blend',
    region: 'Pauillac, Bordeaux',
    color: 'Red',
  },

  // Napa Valley - high markup
  {
    lwin: '1089765',
    lwin7: '1089765',
    displayName: 'Opus One',
    vintage: '2017',
    restaurantPrice: 450,
    realPrice: 185,
    markup: 143,
    criticScore: 95,
    critic: 'Wine Spectator',
    varietal: 'Cabernet Sauvignon Blend',
    region: 'Oakville, Napa Valley',
    color: 'Red',
  },

  // Spanish wine - excellent value
  {
    lwin: '1056789',
    lwin7: '1056789',
    displayName: 'Vega Sicilia Único',
    vintage: '2010',
    restaurantPrice: 380,
    realPrice: 285,
    markup: 33,
    criticScore: 97,
    critic: 'Tim Atkin',
    varietal: 'Tempranillo',
    region: 'Ribera del Duero, Spain',
    color: 'Red',
  },

  // Oregon Pinot - value pick
  {
    lwin: '1067890',
    lwin7: '1067890',
    displayName: 'Domaine Drouhin Pinot Noir',
    vintage: '2019',
    restaurantPrice: 75,
    realPrice: 48,
    markup: 56,
    criticScore: 91,
    critic: 'Wine & Spirits',
    varietal: 'Pinot Noir',
    region: 'Willamette Valley, Oregon',
    color: 'Red',
  },

  // Rhône Valley - solid choice
  {
    lwin: '1078901',
    lwin7: '1078901',
    displayName: 'Château de Beaucastel Châteauneuf-du-Pape',
    vintage: '2016',
    restaurantPrice: 165,
    realPrice: 95,
    markup: 74,
    criticScore: 94,
    critic: 'Jeb Dunnuck',
    varietal: 'Grenache Blend',
    region: 'Châteauneuf-du-Pape, Rhône',
    color: 'Red',
  },

  // Australian Shiraz - unique offering
  {
    lwin: '1089012',
    lwin7: '1089012',
    displayName: 'Penfolds Grange',
    vintage: '2015',
    restaurantPrice: 680,
    realPrice: 520,
    markup: 31,
    criticScore: 98,
    critic: 'James Halliday',
    varietal: 'Shiraz',
    region: 'South Australia',
    color: 'Red',
  },

  // Italian white - affordable luxury
  {
    lwin: '1090123',
    lwin7: '1090123',
    displayName: 'Gaja Gaia & Rey Chardonnay',
    vintage: '2019',
    restaurantPrice: 195,
    realPrice: 135,
    markup: 44,
    criticScore: 93,
    critic: 'Wine Advocate',
    varietal: 'Chardonnay',
    region: 'Piedmont, Italy',
    color: 'White',
  },
];

/**
 * Generate sample wines on demand (for testing larger lists)
 */
export function generateSampleWines(count: number = 20): Wine[] {
  if (count <= SAMPLE_WINES.length) {
    return SAMPLE_WINES.slice(0, count);
  }
  return SAMPLE_WINES;
}

/**
 * Sample wine with MISSING data (for testing edge cases)
 */
export const INCOMPLETE_WINE: Wine = {
  displayName: 'Unknown Wine from Wine List',
  vintage: '2018',
  restaurantPrice: 85,
  // No LWIN, no real price, no scores
};

/**
 * Mixed dataset with some incomplete wines
 */
export function getSampleMixedData(): Wine[] {
  return [
    ...SAMPLE_WINES.slice(0, 8),
    {
      displayName: 'House Red Wine',
      vintage: '2020',
      restaurantPrice: 45,
    } as Wine,
    ...SAMPLE_WINES.slice(8, 12),
    {
      displayName: 'Mystery Cabernet',
      vintage: '2017',
      restaurantPrice: 120,
      realPrice: 75,
      markup: 60,
      // No critic score
    } as Wine,
    ...SAMPLE_WINES.slice(12),
  ];
}

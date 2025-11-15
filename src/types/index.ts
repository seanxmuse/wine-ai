// Type Definitions

export interface Wine {
  id?: string;
  lwin7?: string;
  lwin?: string;
  displayName: string;
  vintage?: string;
  restaurantPrice: number;
  realPrice?: number;
  markup?: number;
  criticScore?: number;
  critic?: string;
  varietal?: string;
  region?: string;
  color?: string;
  drinkingWindow?: string;
}

export interface WineListItem {
  rawText: string;
  wineName: string;
  vintage?: string;
  price: number;
  confidence?: number;
}

export interface Scan {
  id: string;
  userId: string;
  imageUrl: string;
  wines: Wine[];
  createdAt: string;
  restaurantName?: string;
}

export interface WineLabsMatchResponse {
  lwin7?: string;
  lwin?: string;
  display_name?: string;
  confidence?: number; // Our calculated confidence based on match quality
  matched: boolean;     // Whether we got a match from Wine Labs
}

export interface WineLabsPriceStats {
  vintage?: string;
  region: string;
  median?: number;
  min?: number;
  p25?: number;
  p75?: number;
  max?: number;
  count: number;
}

export interface WineLabsCriticScore {
  critic: string;
  score: number;
  vintage?: string;
  drinking_window?: string;
}

export interface WineLabsWineInfo {
  lwin?: string;
  lwin7?: string;
  display_name: string;
  varietal?: string;
  colour?: string;
  region_1?: string;
  region_2?: string;
  region_3?: string;
  country?: string;
}

export interface RankingResults {
  highestRated: Wine[];
  bestValue: Wine[];
  mostInexpensive: Wine[];
}

export type RankingCategory = 'highestRated' | 'bestValue' | 'mostInexpensive';

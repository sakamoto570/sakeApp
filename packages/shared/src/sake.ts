export interface FlavorProfile {
  fruity: number;
  mellow: number;
  rich: number;
  calm: number;
  dry: number;
  light: number;
}

export type FlavorVector = FlavorProfile;

export interface Sake {
  sakeId: string;
  name: string;
  brewery: string;
  prefecture: string;
  flavor: FlavorVector;
}

export interface FlavorCacheEntry {
  sakeId: string;
  flavor: FlavorVector;
  flavorUpdatedAt?: string;
}

export type SakeSummary = Omit<Sake, "flavor">;

export interface SakeRecommendation extends SakeSummary {
  similarity: number;
  reason: string;
}

export interface SakeFlavorRecommendation {
  sakeId: string;
  similarity: number;
  flavor: FlavorProfile;
}

export interface SakeSearchResult {
  sakeId: string;
  name: string;
}

export interface SakeDetail {
  sakeId: string;
  name: string;
  breweryName?: string;
  flavor?: FlavorProfile;
}

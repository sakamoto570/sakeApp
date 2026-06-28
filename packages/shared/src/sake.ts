export type {
  FlavorProfile,
  SakeDetailResponse,
  SakeRecommendation,
  SakeSearchResult,
} from "./types/api";

import type {
  FlavorProfile,
  SakeDetailResponse,
  SakeRecommendation,
} from "./types/api";

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

export type SakeFlavorRecommendation = SakeRecommendation;

export type SakeFlavorRecommendationWithReason = SakeRecommendation;

export type SakeDetail = SakeDetailResponse;

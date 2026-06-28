import type { FlavorProfile } from "./sake";

export type DrinkRating = 1 | 2 | 3 | 4 | 5;

export interface CreateDrinkRequest {
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
  rating?: DrinkRating;
  memo?: string;
  drankAt: string;
}

export interface DrinkRecord extends CreateDrinkRequest {
  userId: string;
  actionKey: `DRINK#${string}`;
  actionType: "DRINK";
  updatedAt: string;
  createdAt: string;
}

export interface DrunkSakeSummary {
  sakeId: string;
  sakeName: string;
  breweryName?: string;
  flavor?: FlavorProfile;
  lastDrankAt: string;
  isFavorite: boolean;
}

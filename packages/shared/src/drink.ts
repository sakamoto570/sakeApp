export type {
  CreateDrinkRequest,
  MySakeItem,
} from "./types/api";

import type { CreateDrinkRequest } from "./types/api";

export type DrinkRating = 1 | 2 | 3 | 4 | 5;

export interface DrinkRecord extends CreateDrinkRequest {
  userId: string;
  actionKey: `DRINK#${string}`;
  actionType: "DRINK";
  updatedAt: string;
  createdAt: string;
}

export type { MySakeItem as DrunkSakeSummary } from "./types/api";

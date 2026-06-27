import type { DrinkRating } from "./drink";
import type { FlavorProfile } from "./sake";

export interface SakeMasterItem {
  sakeId: string;
  flavor: FlavorProfile;
  name?: string;
  breweryName?: string;
  flavorUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserActionBase {
  userId: string;
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserFavoriteItem extends UserActionBase {
  actionKey: `FAVORITE#${string}`;
  actionType: "FAVORITE";
}

export interface UserDrinkItem extends UserActionBase {
  actionKey: `DRINK#${string}`;
  actionType: "DRINK";
  rating?: DrinkRating;
  memo?: string;
  drankAt: string;
}

export type UserActionItem = UserFavoriteItem | UserDrinkItem;

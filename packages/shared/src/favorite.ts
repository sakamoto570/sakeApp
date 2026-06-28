import type { FlavorProfile } from "./sake";

export interface CreateFavoriteRequest {
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
}

export interface Favorite {
  sakeId: string;
  sakeNameSnapshot: string;
  breweryNameSnapshot?: string;
  flavorSnapshot?: FlavorProfile;
  actionKey: `FAVORITE#${string}`;
  actionType: "FAVORITE";
  updatedAt: string;
  createdAt: string;
}

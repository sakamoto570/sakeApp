export type {
  CreateFavoriteRequest,
  FavoriteItem,
  FlavorProfile,
} from "./types/api";

import type { FlavorProfile } from "./types/api";

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

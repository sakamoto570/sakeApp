import type {
  CreateFavoriteRequest,
  Favorite,
  UserFavoriteItem,
} from "@sake-app/shared";

import type { UserActionRepository } from "../repositories/userActionRepository";

export class FavoriteService {
  constructor(private readonly userActionRepository: UserActionRepository) {}

  async createFavorite(
    userId: string,
    request: CreateFavoriteRequest,
  ): Promise<Favorite> {
    const now = new Date().toISOString();
    const item: UserFavoriteItem = {
      userId,
      actionKey: `FAVORITE#${request.sakeId}`,
      actionType: "FAVORITE",
      sakeId: request.sakeId,
      sakeNameSnapshot: request.sakeNameSnapshot,
      breweryNameSnapshot: request.breweryNameSnapshot,
      flavorSnapshot: request.flavorSnapshot,
      createdAt: now,
      updatedAt: now,
    };

    const favorite = await this.userActionRepository.putFavorite(item);

    return {
      sakeId: favorite.sakeId,
      sakeNameSnapshot: favorite.sakeNameSnapshot,
      breweryNameSnapshot: favorite.breweryNameSnapshot,
      flavorSnapshot: favorite.flavorSnapshot,
      actionKey: favorite.actionKey,
      actionType: favorite.actionType,
      createdAt: favorite.createdAt,
      updatedAt: favorite.updatedAt,
    };
  }
}

import type {
  MySakeItem,
  UserDrinkItem,
} from "@sake-app/shared";

import type { UserActionRepository } from "../repositories/userActionRepository";

export class MeService {
  constructor(private readonly userActionRepository: UserActionRepository) {}

  async listDrunkSakes(userId: string): Promise<MySakeItem[]> {
    const [drinks, favorites] = await Promise.all([
      this.userActionRepository.findDrinksByUserId(userId),
      this.userActionRepository.findFavoritesByUserId(userId),
    ]);

    const favoriteSakeIds = new Set(
      favorites.map((favorite) =>
        favorite.actionKey.replace(/^FAVORITE#/, ""),
      ),
    );
    const latestDrinksBySakeId = new Map<string, UserDrinkItem>();

    for (const drink of drinks) {
      const current = latestDrinksBySakeId.get(drink.sakeId);

      if (!current || drink.createdAt > current.createdAt) {
        latestDrinksBySakeId.set(drink.sakeId, drink);
      }
    }

    return Array.from(latestDrinksBySakeId.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((drink) => ({
        sakeId: drink.sakeId,
        sakeName: drink.sakeNameSnapshot,
        breweryName: drink.breweryNameSnapshot,
        flavor: drink.flavorSnapshot,
        imageUrl: drink.imageUrl,
        lastDrankAt: drink.drankAt,
        isFavorite: favoriteSakeIds.has(drink.sakeId),
      }));
  }
}

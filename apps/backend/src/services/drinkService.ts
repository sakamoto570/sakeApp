import type {
  CreateDrinkRequest,
  DrinkRecord,
  UserDrinkItem,
} from "@sake-app/shared";

import type { UserActionRepository } from "../repositories/userActionRepository";

export class DrinkService {
  constructor(private readonly userActionRepository: UserActionRepository) {}

  async createDrink(
    userId: string,
    request: CreateDrinkRequest,
  ): Promise<DrinkRecord> {
    const now = new Date().toISOString();
    const item: UserDrinkItem = {
      userId,
      actionKey: `DRINK#${now}`,
      actionType: "DRINK",
      sakeId: request.sakeId,
      sakeNameSnapshot: request.sakeNameSnapshot,
      breweryNameSnapshot: request.breweryNameSnapshot,
      flavorSnapshot: request.flavorSnapshot,
      rating: request.rating,
      memo: request.memo,
      drankAt: request.drankAt,
      createdAt: now,
      updatedAt: now,
    };

    await this.userActionRepository.putDrink(item);

    return item;
  }
}

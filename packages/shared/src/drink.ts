export type DrinkRating = 1 | 2 | 3 | 4 | 5;

export interface CreateDrinkRequest {
  sakeId: string;
  rating: DrinkRating;
  memo?: string;
  drankAt: string;
}

export interface DrinkRecord extends CreateDrinkRequest {
  drinkId: string;
  createdAt: string;
}


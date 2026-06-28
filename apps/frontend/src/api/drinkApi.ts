import type { CreateDrinkRequest } from "@sake-app/shared";

import { apiJson } from "./client";

export async function createDrink(
  request: CreateDrinkRequest,
): Promise<void> {
  await apiJson<unknown>("/drinks", {
    method: "POST",
    body: request,
  });
}

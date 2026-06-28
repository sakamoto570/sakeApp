import type { CreateFavoriteRequest } from "@sake-app/shared";

import { apiJson, apiRequest } from "./client";

export async function createFavorite(
  request: CreateFavoriteRequest,
): Promise<void> {
  await apiJson<unknown>("/favorites", {
    method: "POST",
    body: request,
  });
}

export async function deleteFavorite(sakeId: string): Promise<void> {
  await apiRequest<unknown>(`/favorites/${encodeURIComponent(sakeId)}`, {
    method: "DELETE",
  });
}

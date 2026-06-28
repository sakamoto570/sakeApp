import { apiJson, apiRequest } from "./client";
export async function createFavorite(request) {
    await apiJson("/favorites", {
        method: "POST",
        body: request,
    });
}
export async function deleteFavorite(sakeId) {
    await apiRequest(`/favorites/${encodeURIComponent(sakeId)}`, {
        method: "DELETE",
    });
}

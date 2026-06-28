import { apiRequest } from "./client";
export function getMySakes() {
    return apiRequest("/me/sakes");
}
export function searchSakes(q) {
    const params = new URLSearchParams({ q });
    return apiRequest(`/sakes/search?${params}`);
}
export function getSakeDetail(sakeId) {
    return apiRequest(`/sakes/${encodeURIComponent(sakeId)}/detail`);
}
export function getRecommendations(sakeId, withReason = false) {
    const params = new URLSearchParams();
    if (withReason) {
        params.set("withReason", "true");
    }
    const query = params.toString();
    return apiRequest(`/sakes/${encodeURIComponent(sakeId)}/recommendations${query ? `?${query}` : ""}`);
}

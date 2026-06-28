import type {
  MySakeItem,
  SakeDetailResponse,
  SakeRecommendation,
  SakeSearchResult,
} from "@sake-app/shared";

import { apiRequest } from "./client";

export function getMySakes(): Promise<MySakeItem[]> {
  return apiRequest<MySakeItem[]>("/me/sakes");
}

export function searchSakes(q: string): Promise<SakeSearchResult[]> {
  const params = new URLSearchParams({ q });

  return apiRequest<SakeSearchResult[]>(`/sakes/search?${params}`);
}

export function getSakeDetail(
  sakeId: string,
): Promise<SakeDetailResponse> {
  return apiRequest<SakeDetailResponse>(
    `/sakes/${encodeURIComponent(sakeId)}/detail`,
  );
}

export function getRecommendations(
  sakeId: string,
  withReason = false,
): Promise<SakeRecommendation[]> {
  const params = new URLSearchParams();

  if (withReason) {
    params.set("withReason", "true");
  }

  const query = params.toString();

  return apiRequest<SakeRecommendation[]>(
    `/sakes/${encodeURIComponent(sakeId)}/recommendations${query ? `?${query}` : ""}`,
  );
}

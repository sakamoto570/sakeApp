import type {
  FlavorProfile,
  SakeFlavorRecommendation,
  SakeMasterItem,
} from "@sake-app/shared";
import { cosineSimilarity } from "@sake-app/utils";

import type { SakeRepository } from "../repositories/sakeRepository";

const RECOMMENDATION_LIMIT = 10;

export interface RecommendationStats {
  fetchedCount: number;
  excludedCount: number;
  recommendationCount: number;
}

export interface RecommendationResult {
  recommendations: SakeFlavorRecommendation[];
  stats: RecommendationStats;
}

export class RecommendationTargetNotFoundError extends Error {
  constructor(sakeId: string) {
    super(`Recommendation target was not found: ${sakeId}`);
    this.name = "RecommendationTargetNotFoundError";
  }
}

export class RecommendationTargetFlavorMissingError extends Error {
  constructor(sakeId: string) {
    super(`Recommendation target flavor is missing: ${sakeId}`);
    this.name = "RecommendationTargetFlavorMissingError";
  }
}

function flavorToVector(flavor: FlavorProfile): number[] {
  return [
    flavor.fruity,
    flavor.mellow,
    flavor.rich,
    flavor.calm,
    flavor.dry,
    flavor.light,
  ];
}

function hasFlavor(item: SakeMasterItem): item is SakeMasterItem & {
  flavor: FlavorProfile;
} {
  return item.flavor !== undefined;
}

export class RecommendationService {
  constructor(private readonly sakeRepository: SakeRepository) {}

  async listRecommendations(sakeId: string): Promise<RecommendationResult> {
    const target = await this.sakeRepository.getSakeMasterItem(sakeId);

    if (!target) {
      throw new RecommendationTargetNotFoundError(sakeId);
    }

    if (!hasFlavor(target)) {
      throw new RecommendationTargetFlavorMissingError(sakeId);
    }

    const targetVector = flavorToVector(target.flavor);
    const items = await this.sakeRepository.listSakeMasterItems();
    let excludedCount = 0;

    const recommendations = items
      .flatMap((item): SakeFlavorRecommendation[] => {
        if (item.sakeId === sakeId || !hasFlavor(item)) {
          excludedCount += 1;
          return [];
        }

        return [
          {
            sakeId: item.sakeId,
            similarity: cosineSimilarity(targetVector, flavorToVector(item.flavor)),
            flavor: item.flavor,
          },
        ];
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, RECOMMENDATION_LIMIT);

    return {
      recommendations,
      stats: {
        fetchedCount: items.length,
        excludedCount,
        recommendationCount: recommendations.length,
      },
    };
  }
}

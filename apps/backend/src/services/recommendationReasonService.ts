import type {
  FlavorProfile,
  SakeFlavorRecommendation,
  SakeFlavorRecommendationWithReason,
} from "@sake-app/shared";

import {
  BedrockClaudeClient,
  type BedrockTextClient,
} from "../clients/bedrockClient";
import { buildRecommendationReasonPrompt } from "../prompts/recommendationReasonPrompt";

const BEDROCK_RECOMMENDATION_LIMIT = 5;

interface RecommendationReasonResponseItem {
  sakeId: string;
  reason: string;
}

function isRecommendationReasonResponseItem(
  value: unknown,
): value is RecommendationReasonResponseItem {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.sakeId === "string" &&
    typeof item.reason === "string" &&
    item.reason.trim().length > 0
  );
}

function parseReasonResponse(
  responseText: string,
): RecommendationReasonResponseItem[] {
  const parsed: unknown = JSON.parse(responseText);

  if (!Array.isArray(parsed)) {
    throw new Error("Recommendation reason response must be an array");
  }

  if (!parsed.every(isRecommendationReasonResponseItem)) {
    throw new Error("Recommendation reason response item is invalid");
  }

  return parsed;
}

export class RecommendationReasonService {
  constructor(
    private readonly bedrockClient: BedrockTextClient =
      new BedrockClaudeClient(),
  ) {}

  async addReasons(
    input: {
      sakeId: string;
      flavor: FlavorProfile;
    },
    recommendations: SakeFlavorRecommendation[],
  ): Promise<SakeFlavorRecommendationWithReason[]> {
    const targetRecommendations = recommendations.slice(
      0,
      BEDROCK_RECOMMENDATION_LIMIT,
    );

    if (targetRecommendations.length === 0) {
      return recommendations;
    }

    const prompt = buildRecommendationReasonPrompt({
      input,
      recommendations: targetRecommendations,
    });
    const responseText = await this.bedrockClient.generateText(prompt);
    const reasons = parseReasonResponse(responseText);
    const reasonBySakeId = new Map(
      reasons.map((item) => [item.sakeId, item.reason] as const),
    );

    return recommendations.map((recommendation) => {
      const reason = reasonBySakeId.get(recommendation.sakeId);

      return reason
        ? {
            ...recommendation,
            reason,
          }
        : recommendation;
    });
  }
}

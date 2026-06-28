import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
} from "@sake-app/shared";

import { SakenowaClientError } from "../clients/sakenowaClient";
import { getSakeRepository } from "../repositories/sakeRepository";
import {
  SakeDetailService,
  SakeNotFoundError,
} from "../services/sakeDetailService";
import {
  RecommendationService,
  RecommendationTargetFlavorMissingError,
  RecommendationTargetNotFoundError,
} from "../services/recommendationService";
import { SakeSearchService } from "../services/sakeSearchService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

interface SearchQuery {
  q?: string;
}

interface SakeIdParams {
  sakeId?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const sakeRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: SearchQuery;
  }>("/search", async (request, reply) => {
    const event = (request as LambdaDecoratedRequest).awsLambda?.event;
    const userId = event ? getAuthenticatedUserId(event) : undefined;

    if (!userId) {
      return reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required",
        },
      });
    }

    const { q } = request.query;

    if (!isNonEmptyString(q)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "q is required",
        },
      });
    }

    try {
      const searchService = new SakeSearchService();
      const results = await searchService.search(q);

      return reply.send(results);
    } catch (error) {
      if (error instanceof SakenowaClientError) {
        request.log.error(error);

        return reply.status(502).send({
          error: {
            code: "SAKENOWA_BAD_GATEWAY",
            message: "Failed to fetch Sakenowa brands",
          },
        });
      }

      throw error;
    }
  });

  app.get<{
    Params: SakeIdParams;
  }>("/:sakeId/detail", async (request, reply) => {
    const event = (request as LambdaDecoratedRequest).awsLambda?.event;
    const userId = event ? getAuthenticatedUserId(event) : undefined;

    if (!userId) {
      return reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required",
        },
      });
    }

    const { sakeId } = request.params;

    if (!isNonEmptyString(sakeId)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "sakeId is required",
        },
      });
    }

    try {
      const detailService = new SakeDetailService(getSakeRepository());
      const detail = await detailService.getDetail(sakeId);

      return reply.send(detail);
    } catch (error) {
      if (error instanceof SakeNotFoundError) {
        return reply.status(404).send({
          error: {
            code: "SAKE_NOT_FOUND",
            message: "Sake was not found",
          },
        });
      }

      if (error instanceof SakenowaClientError) {
        request.log.error(error);

        return reply.status(502).send({
          error: {
            code: "SAKENOWA_BAD_GATEWAY",
            message: "Failed to fetch Sakenowa data",
          },
        });
      }

      throw error;
    }
  });

  app.get<{
    Params: SakeIdParams;
  }>("/:sakeId/recommendations", async (request, reply) => {
    const event = (request as LambdaDecoratedRequest).awsLambda?.event;
    const userId = event ? getAuthenticatedUserId(event) : undefined;

    if (!userId) {
      return reply.status(401).send({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication is required",
        },
      });
    }

    const { sakeId } = request.params;

    if (!isNonEmptyString(sakeId)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "sakeId is required",
        },
      });
    }

    try {
      const recommendationService = new RecommendationService(
        getSakeRepository(),
      );
      const result = await recommendationService.listRecommendations(
        sakeId,
      );

      request.log.info(
        {
          sakeId,
          fetchedCount: result.stats.fetchedCount,
          excludedCount: result.stats.excludedCount,
          recommendationCount: result.stats.recommendationCount,
        },
        "Calculated sake recommendations",
      );

      return reply.send(result.recommendations);
    } catch (error) {
      if (error instanceof RecommendationTargetNotFoundError) {
        return reply.status(404).send({
          error: {
            code: "SAKE_NOT_FOUND",
            message: "Sake was not found",
          },
        });
      }

      if (error instanceof RecommendationTargetFlavorMissingError) {
        return reply.status(422).send({
          error: {
            code: "SAKE_FLAVOR_MISSING",
            message: "Sake flavor is missing",
          },
        });
      }

      throw error;
    }
  });
};

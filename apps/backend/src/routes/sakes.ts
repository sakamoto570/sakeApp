import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
} from "@sake-app/shared";

import { SakenowaClientError } from "../clients/sakenowaClient";
import { SakeSearchService } from "../services/sakeSearchService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

interface SearchQuery {
  q?: string;
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

  app.get("/:sakeId/recommendations", async () => {
    throw new Error("Not implemented");
  });
};

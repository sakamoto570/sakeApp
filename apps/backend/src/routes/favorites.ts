import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
  type CreateFavoriteRequest,
  type FlavorProfile,
} from "@sake-app/shared";

import { getUserActionRepository } from "../repositories/userActionRepository";
import { FavoriteService } from "../services/favoriteService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

interface DeleteFavoriteParams {
  sakeId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFlavorProfile(value: unknown): value is FlavorProfile {
  if (!isRecord(value)) {
    return false;
  }

  return ["fruity", "mellow", "rich", "calm", "dry", "light"].every(
    (key) => typeof value[key] === "number",
  );
}

function parseCreateFavoriteRequest(
  body: unknown,
): { data?: CreateFavoriteRequest; message?: string } {
  if (!isRecord(body)) {
    return { message: "Request body must be an object" };
  }

  if (!isNonEmptyString(body.sakeId)) {
    return { message: "sakeId is required" };
  }

  if (!isNonEmptyString(body.sakeNameSnapshot)) {
    return { message: "sakeNameSnapshot is required" };
  }

  if (
    body.breweryNameSnapshot !== undefined &&
    typeof body.breweryNameSnapshot !== "string"
  ) {
    return { message: "breweryNameSnapshot must be a string" };
  }

  if (
    body.flavorSnapshot !== undefined &&
    !isFlavorProfile(body.flavorSnapshot)
  ) {
    return { message: "flavorSnapshot is invalid" };
  }

  if (body.imageUrl !== undefined && typeof body.imageUrl !== "string") {
    return { message: "imageUrl must be a string" };
  }

  return {
    data: {
      sakeId: body.sakeId,
      sakeNameSnapshot: body.sakeNameSnapshot,
      breweryNameSnapshot: body.breweryNameSnapshot,
      flavorSnapshot: body.flavorSnapshot,
      imageUrl: body.imageUrl,
    },
  };
}

export const favoriteRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (request, reply) => {
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

    const parsed = parseCreateFavoriteRequest(request.body);

    if (!parsed.data) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message ?? "Invalid request body",
        },
      });
    }

    const favoriteService = new FavoriteService(getUserActionRepository());
    const favorite = await favoriteService.createFavorite(userId, parsed.data);

    return reply.status(201).send({ data: favorite });
  });

  app.delete<{
    Params: DeleteFavoriteParams;
  }>("/:sakeId", async (request, reply) => {
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
      const favoriteService = new FavoriteService(getUserActionRepository());
      await favoriteService.deleteFavorite(userId, sakeId);

      return reply.send({ success: true });
    } catch (error) {
      request.log.error(error);

      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete favorite",
        },
      });
    }
  });
};

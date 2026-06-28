import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
  type CreateDrinkRequest,
  type DrinkRating,
  type FlavorProfile,
} from "@sake-app/shared";

import { getUserActionRepository } from "../repositories/userActionRepository";
import { DrinkService } from "../services/drinkService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDrinkRating(value: unknown): value is DrinkRating {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  );
}

function isFlavorProfile(value: unknown): value is FlavorProfile {
  if (!isRecord(value)) {
    return false;
  }

  return ["fruity", "mellow", "rich", "calm", "dry", "light"].every(
    (key) => typeof value[key] === "number",
  );
}

function parseCreateDrinkRequest(
  body: unknown,
): { data?: CreateDrinkRequest; message?: string } {
  if (!isRecord(body)) {
    return { message: "Request body must be an object" };
  }

  if (!isNonEmptyString(body.sakeId)) {
    return { message: "sakeId is required" };
  }

  if (!isNonEmptyString(body.sakeNameSnapshot)) {
    return { message: "sakeNameSnapshot is required" };
  }

  if (!isNonEmptyString(body.drankAt)) {
    return { message: "drankAt is required" };
  }

  if (body.rating !== undefined && !isDrinkRating(body.rating)) {
    return { message: "rating must be between 1 and 5" };
  }

  if (
    body.breweryNameSnapshot !== undefined &&
    typeof body.breweryNameSnapshot !== "string"
  ) {
    return { message: "breweryNameSnapshot must be a string" };
  }

  if (body.memo !== undefined && typeof body.memo !== "string") {
    return { message: "memo must be a string" };
  }

  if (body.imageUrl !== undefined && typeof body.imageUrl !== "string") {
    return { message: "imageUrl must be a string" };
  }

  if (
    body.flavorSnapshot !== undefined &&
    !isFlavorProfile(body.flavorSnapshot)
  ) {
    return { message: "flavorSnapshot is invalid" };
  }

  return {
    data: {
      sakeId: body.sakeId,
      sakeNameSnapshot: body.sakeNameSnapshot,
      breweryNameSnapshot: body.breweryNameSnapshot,
      flavorSnapshot: body.flavorSnapshot,
      imageUrl: body.imageUrl,
      rating: body.rating,
      memo: body.memo,
      drankAt: body.drankAt,
    },
  };
}

export const drinkRoutes: FastifyPluginAsync = async (app) => {
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

    const parsed = parseCreateDrinkRequest(request.body);

    if (!parsed.data) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message ?? "Invalid request body",
        },
      });
    }

    const drinkService = new DrinkService(getUserActionRepository());
    const drink = await drinkService.createDrink(userId, parsed.data);

    return reply.status(201).send({ data: drink });
  });

  app.get("/", async () => {
    throw new Error("Not implemented");
  });
};

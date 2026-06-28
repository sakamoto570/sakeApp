import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
} from "@sake-app/shared";

import { getUserActionRepository } from "../repositories/userActionRepository";
import { MeService } from "../services/meService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get("/sakes", async (request, reply) => {
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

    const meService = new MeService(getUserActionRepository());
    const sakes = await meService.listDrunkSakes(userId);

    return reply.send(sakes);
  });
};

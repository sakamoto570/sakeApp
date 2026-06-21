import type { FastifyPluginAsync } from "fastify";

export const sakeRoutes: FastifyPluginAsync = async (app) => {
  app.get("/search", async () => {
    throw new Error("Not implemented");
  });

  app.get("/:sakeId/recommendations", async () => {
    throw new Error("Not implemented");
  });
};


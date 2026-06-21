import type { FastifyPluginAsync } from "fastify";

export const drinkRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async () => {
    throw new Error("Not implemented");
  });

  app.get("/", async () => {
    throw new Error("Not implemented");
  });
};


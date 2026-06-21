import type { FastifyPluginAsync } from "fastify";

export const favoriteRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async () => {
    throw new Error("Not implemented");
  });

  app.delete("/:sakeId", async () => {
    throw new Error("Not implemented");
  });
};


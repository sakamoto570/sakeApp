import Fastify from "fastify";

import { drinkRoutes } from "./routes/drinks";
import { favoriteRoutes } from "./routes/favorites";
import { sakeRoutes } from "./routes/sakes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(sakeRoutes, { prefix: "/sakes" });
  app.register(favoriteRoutes, { prefix: "/favorites" });
  app.register(drinkRoutes, { prefix: "/drinks" });

  return app;
}


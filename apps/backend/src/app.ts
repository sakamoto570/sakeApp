import Fastify from "fastify";

import { drinkRoutes } from "./routes/drinks";
import { favoriteRoutes } from "./routes/favorites";
import { imageRoutes } from "./routes/images";
import { meRoutes } from "./routes/me";
import { sakeRoutes } from "./routes/sakes";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(sakeRoutes, { prefix: "/sakes" });
  app.register(favoriteRoutes, { prefix: "/favorites" });
  app.register(drinkRoutes, { prefix: "/drinks" });
  app.register(imageRoutes, { prefix: "/images" });
  app.register(meRoutes, { prefix: "/me" });

  return app;
}

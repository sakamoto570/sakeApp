import type { FastifyPluginAsync } from "fastify";

export const authPlugin: FastifyPluginAsync = async () => {
  // API Gateway validates JWTs. User claims will be exposed here.
};


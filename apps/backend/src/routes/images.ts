import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import {
  getAuthenticatedUserId,
  type AuthenticatedLambdaEvent,
  type CreateImageUploadUrlRequest,
  type CreateImageViewUrlRequest,
} from "@sake-app/shared";

import { ImageUploadService } from "../services/imageUploadService";

interface LambdaDecoratedRequest extends FastifyRequest {
  awsLambda?: {
    event?: AuthenticatedLambdaEvent;
  };
}

function parseCreateViewUrlRequest(
  body: unknown,
): { data?: CreateImageViewUrlRequest; message?: string } {
  if (!isRecord(body)) {
    return { message: "Request body must be an object" };
  }

  if (!isNonEmptyString(body.imageUrl)) {
    return { message: "imageUrl is required" };
  }

  return {
    data: {
      imageUrl: body.imageUrl,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseCreateUploadUrlRequest(
  body: unknown,
): { data?: CreateImageUploadUrlRequest; message?: string } {
  if (!isRecord(body)) {
    return { message: "Request body must be an object" };
  }

  if (!isNonEmptyString(body.fileName)) {
    return { message: "fileName is required" };
  }

  if (!isNonEmptyString(body.contentType)) {
    return { message: "contentType is required" };
  }

  return {
    data: {
      fileName: body.fileName,
      contentType: body.contentType,
    },
  };
}

function getImageUploadService(): ImageUploadService {
  const bucketName = process.env.DRINK_IMAGES_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("DRINK_IMAGES_BUCKET_NAME is not configured");
  }

  return new ImageUploadService(bucketName);
}

export const imageRoutes: FastifyPluginAsync = async (app) => {
  app.post("/upload-url", async (request, reply) => {
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

    const parsed = parseCreateUploadUrlRequest(request.body);

    if (!parsed.data) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message ?? "Invalid request body",
        },
      });
    }

    try {
      const upload = await getImageUploadService().createUploadUrl(
        userId,
        parsed.data,
      );

      return reply.send(upload);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Unsupported image content type"
      ) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
          },
        });
      }

      throw error;
    }
  });

  app.post("/view-url", async (request, reply) => {
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

    const parsed = parseCreateViewUrlRequest(request.body);

    if (!parsed.data) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.message ?? "Invalid request body",
        },
      });
    }

    try {
      const viewUrl = await getImageUploadService().createViewUrl(
        userId,
        parsed.data.imageUrl,
      );

      return reply.send(viewUrl);
    } catch (error) {
      if (error instanceof Error && error.message === "Image key is not allowed") {
        return reply.status(403).send({
          error: {
            code: "FORBIDDEN",
            message: error.message,
          },
        });
      }

      throw error;
    }
  });
};

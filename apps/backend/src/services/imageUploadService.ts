import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import type {
  CreateImageUploadUrlRequest,
  CreateImageUploadUrlResponse,
  CreateImageViewUrlResponse,
} from "@sake-app/shared";

import {
  createPresignedGetUrl,
  createPresignedPutUrl,
} from "../clients/s3UploadClient";

const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function formatDateKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function extensionFromRequest(fileName: string, contentType: string): string {
  const extension = extname(fileName).toLowerCase();

  if ([".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
    return extension === ".jpeg" ? ".jpg" : extension;
  }

  if (contentType === "image/png") {
    return ".png";
  }

  if (contentType === "image/webp") {
    return ".webp";
  }

  return ".jpg";
}

export class ImageUploadService {
  constructor(private readonly bucketName: string) {}

  async createUploadUrl(
    userId: string,
    request: CreateImageUploadUrlRequest,
  ): Promise<CreateImageUploadUrlResponse> {
    if (!ALLOWED_IMAGE_CONTENT_TYPES.has(request.contentType)) {
      throw new Error("Unsupported image content type");
    }

    const extension = extensionFromRequest(
      request.fileName,
      request.contentType,
    );
    const imageUrl = `users/${userId}/${formatDateKey()}/${randomUUID()}${extension}`;
    const uploadUrl = await createPresignedPutUrl({
      bucketName: this.bucketName,
      key: imageUrl,
      contentType: request.contentType,
    });

    return {
      uploadUrl,
      imageUrl,
    };
  }

  async createViewUrl(
    userId: string,
    imageUrl: string,
  ): Promise<CreateImageViewUrlResponse> {
    const allowedPrefix = `users/${userId}/`;

    if (!imageUrl.startsWith(allowedPrefix)) {
      throw new Error("Image key is not allowed");
    }

    return {
      viewUrl: await createPresignedGetUrl({
        bucketName: this.bucketName,
        key: imageUrl,
      }),
    };
  }
}

import type {
  CreateImageUploadUrlRequest,
  CreateImageUploadUrlResponse,
  CreateImageViewUrlResponse,
} from "@sake-app/shared";

import { apiJson } from "./client";

export function createImageUploadUrl(
  request: CreateImageUploadUrlRequest,
): Promise<CreateImageUploadUrlResponse> {
  return apiJson<CreateImageUploadUrlResponse>("/images/upload-url", {
    method: "POST",
    body: request,
  });
}

export function createImageViewUrl(
  imageUrl: string,
): Promise<CreateImageViewUrlResponse> {
  return apiJson<CreateImageViewUrlResponse>("/images/view-url", {
    method: "POST",
    body: { imageUrl },
  });
}

export async function uploadImageToS3(params: {
  uploadUrl: string;
  file: File;
}): Promise<void> {
  const response = await fetch(params.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": params.file.type,
    },
    body: params.file,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }
}

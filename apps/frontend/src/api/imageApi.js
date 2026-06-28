import { apiJson } from "./client";
export function createImageUploadUrl(request) {
    return apiJson("/images/upload-url", {
        method: "POST",
        body: request,
    });
}
export function createImageViewUrl(imageUrl) {
    return apiJson("/images/view-url", {
        method: "POST",
        body: { imageUrl },
    });
}
export async function uploadImageToS3(params) {
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

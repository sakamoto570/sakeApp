const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const cognitoConfig = {
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
    region: import.meta.env.VITE_COGNITO_REGION ?? "",
};
let tokenProvider = () => localStorage.getItem("sakeApp.idToken") ??
    localStorage.getItem("sakeApp.accessToken");
export function setAuthTokenProvider(provider) {
    tokenProvider = provider;
}
export class ApiClientError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = "ApiClientError";
    }
}
async function buildHeaders(headers) {
    const nextHeaders = new Headers(headers);
    const token = await tokenProvider();
    if (token && !nextHeaders.has("Authorization")) {
        nextHeaders.set("Authorization", `Bearer ${token}`);
    }
    return nextHeaders;
}
export async function apiRequest(path, init = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers: await buildHeaders(init.headers),
    });
    if (!response.ok) {
        throw new ApiClientError(`API request failed: ${response.status}`, response.status);
    }
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
export async function apiJson(path, init = {}) {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    return apiRequest(path, {
        ...init,
        headers,
        body: init.body === undefined || typeof init.body === "string"
            ? init.body
            : JSON.stringify(init.body),
    });
}

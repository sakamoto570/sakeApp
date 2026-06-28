const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID ?? "",
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID ?? "",
  region: import.meta.env.VITE_COGNITO_REGION ?? "",
};

type TokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: TokenProvider = () =>
  localStorage.getItem("sakeApp.idToken") ??
  localStorage.getItem("sakeApp.accessToken");

export function setAuthTokenProvider(provider: TokenProvider): void {
  tokenProvider = provider;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function buildHeaders(headers?: HeadersInit): Promise<Headers> {
  const nextHeaders = new Headers(headers);
  const token = await tokenProvider();

  if (token && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: await buildHeaders(init.headers),
  });

  if (!response.ok) {
    throw new ApiClientError(
      `API request failed: ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

type JsonRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiJson<T>(
  path: string,
  init: JsonRequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return apiRequest<T>(path, {
    ...init,
    headers,
    body:
      init.body === undefined || typeof init.body === "string"
        ? init.body
        : JSON.stringify(init.body),
  });
}

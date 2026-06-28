const BRANDS_URL = "https://muro.sakenowa.com/sakenowa-data/api/brands";

export interface SakenowaBrand {
  id: number;
  name: string;
  breweryId: number;
}

interface SakenowaBrandsResponse {
  brands: SakenowaBrand[];
}

export class SakenowaClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SakenowaClientError";
  }
}

function isSakenowaBrand(value: unknown): value is SakenowaBrand {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const brand = value as Record<string, unknown>;

  return (
    typeof brand.id === "number" &&
    typeof brand.name === "string" &&
    typeof brand.breweryId === "number"
  );
}

function isSakenowaBrandsResponse(
  value: unknown,
): value is SakenowaBrandsResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    Array.isArray(response.brands) &&
    response.brands.every(isSakenowaBrand)
  );
}

export async function fetchBrands(): Promise<SakenowaBrand[]> {
  let response: Response;

  try {
    response = await fetch(BRANDS_URL, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new SakenowaClientError(
      `Sakenowa brands request failed: ${String(error)}`,
    );
  }

  if (!response.ok) {
    throw new SakenowaClientError(
      `Sakenowa brands request failed: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  if (!isSakenowaBrandsResponse(body)) {
    throw new SakenowaClientError("Sakenowa brands response is invalid");
  }

  return body.brands;
}

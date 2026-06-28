const BRANDS_URL = "https://muro.sakenowa.com/sakenowa-data/api/brands";
const BREWERIES_URL =
  "https://muro.sakenowa.com/sakenowa-data/api/breweries";

export interface SakenowaBrand {
  id: number;
  name: string;
  breweryId: number;
}

interface SakenowaBrandsResponse {
  brands: SakenowaBrand[];
}

export interface SakenowaBrewery {
  id: number;
  name: string;
  areaId: number;
}

interface SakenowaBreweriesResponse {
  breweries: SakenowaBrewery[];
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

function isSakenowaBrewery(value: unknown): value is SakenowaBrewery {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const brewery = value as Record<string, unknown>;

  return (
    typeof brewery.id === "number" &&
    typeof brewery.name === "string" &&
    typeof brewery.areaId === "number"
  );
}

function isSakenowaBreweriesResponse(
  value: unknown,
): value is SakenowaBreweriesResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const response = value as Record<string, unknown>;

  return (
    Array.isArray(response.breweries) &&
    response.breweries.every(isSakenowaBrewery)
  );
}

async function fetchSakenowaJson(url: string, label: string): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new SakenowaClientError(
      `Sakenowa ${label} request failed: ${String(error)}`,
    );
  }

  if (!response.ok) {
    throw new SakenowaClientError(
      `Sakenowa ${label} request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export async function fetchBrands(): Promise<SakenowaBrand[]> {
  const body = await fetchSakenowaJson(BRANDS_URL, "brands");

  if (!isSakenowaBrandsResponse(body)) {
    throw new SakenowaClientError("Sakenowa brands response is invalid");
  }

  return body.brands;
}

export async function fetchBreweries(): Promise<SakenowaBrewery[]> {
  const body = await fetchSakenowaJson(BREWERIES_URL, "breweries");

  if (!isSakenowaBreweriesResponse(body)) {
    throw new SakenowaClientError(
      "Sakenowa breweries response is invalid",
    );
  }

  return body.breweries;
}

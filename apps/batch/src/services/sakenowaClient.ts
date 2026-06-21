const FLAVOR_CHARTS_URL =
  "https://muro.sakenowa.com/sakenowa-data/api/flavor-charts";

export async function fetchFlavorCharts(): Promise<unknown> {
  const response = await fetch(FLAVOR_CHARTS_URL, {
    headers: {
      accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(
      `Sakenowa flavor charts request failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

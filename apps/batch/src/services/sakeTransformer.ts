import type { FlavorCacheEntry, FlavorVector } from "@sake-app/shared";

interface FlavorChart {
  brandId: number;
  f1: number;
  f2: number;
  f3: number;
  f4: number;
  f5: number;
  f6: number;
}

export interface FlavorTransformResult {
  entries: FlavorCacheEntry[];
  totalCount: number;
  skippedCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFlavorChart(value: unknown): FlavorChart | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const numericFields = ["brandId", "f1", "f2", "f3", "f4", "f5", "f6"] as const;

  for (const field of numericFields) {
    if (typeof value[field] !== "number" || !Number.isFinite(value[field])) {
      return undefined;
    }
  }

  const chart = value as unknown as FlavorChart;

  if (!Number.isInteger(chart.brandId) || chart.brandId < 0) {
    return undefined;
  }

  return chart;
}

function toFlavorVector(chart: FlavorChart): FlavorVector {
  return {
    fruity: chart.f1,
    mellow: chart.f2,
    rich: chart.f3,
    calm: chart.f4,
    dry: chart.f5,
    light: chart.f6,
  };
}

export function transformFlavorCharts(source: unknown): FlavorTransformResult {
  if (!isRecord(source) || !Array.isArray(source.flavorCharts)) {
    throw new Error("Sakenowa response must contain a flavorCharts array");
  }

  const entries: FlavorCacheEntry[] = [];
  let skippedCount = 0;

  source.flavorCharts.forEach((value, index) => {
    const chart = parseFlavorChart(value);

    if (!chart) {
      skippedCount += 1;
      console.warn("Skipping invalid Sakenowa flavor chart", { index });
      return;
    }

    entries.push({
      sakeId: String(chart.brandId),
      flavor: toFlavorVector(chart),
    });
  });

  return {
    entries,
    totalCount: source.flavorCharts.length,
    skippedCount,
  };
}

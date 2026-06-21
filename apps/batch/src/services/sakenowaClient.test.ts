import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchFlavorCharts } from "./sakenowaClient";

describe("fetchFlavorCharts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the parsed API response", async () => {
    const responseBody = {
      flavorCharts: [
        {
          brandId: 2,
          f1: 0.1,
          f2: 0.2,
          f3: 0.3,
          f4: 0.4,
          f5: 0.5,
          f6: 0.6,
        },
      ],
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchFlavorCharts()).resolves.toEqual(responseBody);
  });

  it("throws when the API responds with an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );

    await expect(fetchFlavorCharts()).rejects.toThrow(
      "Sakenowa flavor charts request failed: 503 Service Unavailable",
    );
  });
});

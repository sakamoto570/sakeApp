import { describe, expect, it, vi } from "vitest";

import { transformFlavorCharts } from "./sakeTransformer";

describe("transformFlavorCharts", () => {
  it("maps the Sakenowa fields to the application flavor vector", () => {
    const result = transformFlavorCharts({
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
    });

    expect(result).toEqual({
      entries: [
        {
          sakeId: "2",
          flavor: {
            fruity: 0.1,
            mellow: 0.2,
            rich: 0.3,
            calm: 0.4,
            dry: 0.5,
            light: 0.6,
          },
        },
      ],
      totalCount: 1,
      skippedCount: 0,
    });
  });

  it("skips an invalid record and logs it", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      transformFlavorCharts({
        flavorCharts: [
          { brandId: 2 },
          {
            brandId: 3,
            f1: 0.1,
            f2: 0.2,
            f3: 0.3,
            f4: 0.4,
            f5: 0.5,
            f6: 0.6,
          },
        ],
      }),
    ).toMatchObject({
      totalCount: 2,
      skippedCount: 1,
      entries: [{ sakeId: "3" }],
    });
    expect(warn).toHaveBeenCalledWith(
      "Skipping invalid Sakenowa flavor chart",
      { index: 0 },
    );

    warn.mockRestore();
  });

  it("rejects an invalid top-level response", () => {
    expect(() => transformFlavorCharts({ flavorChart: [] })).toThrow(
      "Sakenowa response must contain a flavorCharts array",
    );
  });
});

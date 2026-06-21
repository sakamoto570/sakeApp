import { describe, expect, it, vi } from "vitest";

import { updateSakeMasterFlavors } from "./sakeMasterRepository";

const flavor = {
  fruity: 0.1,
  mellow: 0.2,
  rich: 0.3,
  calm: 0.4,
  dry: 0.5,
  light: 0.6,
};

describe("updateSakeMasterFlavors", () => {
  it("updates only flavor and timestamp attributes", async () => {
    const send = vi.fn().mockResolvedValue({});
    const client = { send } as never;

    const result = await updateSakeMasterFlavors(
      client,
      "SakeMaster",
      [{ sakeId: "2", flavor }],
      "2026-06-14T00:00:00.000Z",
    );

    expect(result).toEqual({ updatedCount: 1, failedCount: 0 });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0]?.[0].input).toEqual({
      TableName: "SakeMaster",
      Key: { sakeId: "2" },
      UpdateExpression:
        "SET #flavor = :flavor, #flavorUpdatedAt = :now, " +
        "#updatedAt = :now, " +
        "#createdAt = if_not_exists(#createdAt, :now)",
      ExpressionAttributeNames: {
        "#flavor": "flavor",
        "#flavorUpdatedAt": "flavorUpdatedAt",
        "#updatedAt": "updatedAt",
        "#createdAt": "createdAt",
      },
      ExpressionAttributeValues: {
        ":flavor": flavor,
        ":now": "2026-06-14T00:00:00.000Z",
      },
    });
  });

  it("retries retryable errors", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce({ name: "ThrottlingException" })
      .mockResolvedValue({});
    const client = { send } as never;

    const result = await updateSakeMasterFlavors(
      client,
      "SakeMaster",
      [{ sakeId: "2", flavor }],
      "2026-06-14T00:00:00.000Z",
    );

    expect(result).toEqual({ updatedCount: 1, failedCount: 0 });
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("counts a non-retryable update failure", async () => {
    const errorLog = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const send = vi.fn().mockRejectedValue(new Error("Access denied"));
    const client = { send } as never;

    const result = await updateSakeMasterFlavors(
      client,
      "SakeMaster",
      [{ sakeId: "2", flavor }],
      "2026-06-14T00:00:00.000Z",
    );

    expect(result).toEqual({ updatedCount: 0, failedCount: 1 });
    expect(send).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith(
      "Failed to update sake flavor",
      expect.objectContaining({ sakeId: "2" }),
    );

    errorLog.mockRestore();
  });
});

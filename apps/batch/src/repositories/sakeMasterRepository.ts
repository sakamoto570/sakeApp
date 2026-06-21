import {
  UpdateCommand,
  type DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import type { FlavorCacheEntry } from "@sake-app/shared";

import { chunk } from "../utils/chunk";

const UPDATE_CONCURRENCY = 10;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 100;

export interface FlavorUpdateResult {
  updatedCount: number;
  failedCount: number;
}

function isRetryableError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const awsError = error as {
    name?: string;
    $retryable?: unknown;
  };

  return Boolean(awsError.$retryable) || [
    "InternalServerError",
    "ProvisionedThroughputExceededException",
    "RequestLimitExceeded",
    "ThrottlingException",
  ].includes(awsError.name ?? "");
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function updateFlavor(
  client: DynamoDBDocumentClient,
  tableName: string,
  entry: FlavorCacheEntry,
  now: string,
): Promise<void> {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      sakeId: entry.sakeId,
    },
    UpdateExpression:
      "SET #flavor = :flavor, " +
      "#flavorUpdatedAt = :now, " +
      "#updatedAt = :now, " +
      "#createdAt = if_not_exists(#createdAt, :now)",
    ExpressionAttributeNames: {
      "#flavor": "flavor",
      "#flavorUpdatedAt": "flavorUpdatedAt",
      "#updatedAt": "updatedAt",
      "#createdAt": "createdAt",
    },
    ExpressionAttributeValues: {
      ":flavor": entry.flavor,
      ":now": now,
    },
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await client.send(command);
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS || !isRetryableError(error)) {
        throw error;
      }

      await wait(BASE_RETRY_DELAY_MS * 2 ** (attempt - 1));
    }
  }
}

export async function updateSakeMasterFlavors(
  client: DynamoDBDocumentClient,
  tableName: string,
  entries: readonly FlavorCacheEntry[],
  now: string,
): Promise<FlavorUpdateResult> {
  let updatedCount = 0;
  let failedCount = 0;

  for (const entriesChunk of chunk(entries, UPDATE_CONCURRENCY)) {
    const results = await Promise.allSettled(
      entriesChunk.map((entry) =>
        updateFlavor(client, tableName, entry, now),
      ),
    );

    results.forEach((result, index) => {
      const entry = entriesChunk[index];

      if (result.status === "fulfilled") {
        updatedCount += 1;
        return;
      }

      failedCount += 1;
      console.error("Failed to update sake flavor", {
        sakeId: entry?.sakeId,
        error: result.reason,
      });
    });
  }

  return {
    updatedCount,
    failedCount,
  };
}

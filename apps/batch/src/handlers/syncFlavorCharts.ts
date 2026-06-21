import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import {
  updateSakeMasterFlavors,
  type FlavorUpdateResult,
} from "../repositories/sakeMasterRepository";
import { fetchFlavorCharts } from "../services/sakenowaClient";
import { transformFlavorCharts } from "../services/sakeTransformer";

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export interface FlavorSyncResult extends FlavorUpdateResult {
  fetchedCount: number;
  skippedCount: number;
  flavorUpdatedAt: string;
}

export async function syncFlavorCharts(
  client: DynamoDBDocumentClient,
  tableName: string,
): Promise<FlavorSyncResult> {
  const response = await fetchFlavorCharts();
  const transformed = transformFlavorCharts(response);
  const flavorUpdatedAt = new Date().toISOString();
  const updateResult = await updateSakeMasterFlavors(
    client,
    tableName,
    transformed.entries,
    flavorUpdatedAt,
  );

  const result: FlavorSyncResult = {
    fetchedCount: transformed.totalCount,
    updatedCount: updateResult.updatedCount,
    skippedCount: transformed.skippedCount,
    failedCount: updateResult.failedCount,
    flavorUpdatedAt,
  };

  console.info("Sakenowa flavor chart sync completed", result);

  return result;
}

export async function handler(): Promise<FlavorSyncResult> {
  const tableName = process.env.SAKE_MASTER_TABLE_NAME;

  if (!tableName) {
    throw new Error("SAKE_MASTER_TABLE_NAME is not configured");
  }

  return syncFlavorCharts(documentClient, tableName);
}

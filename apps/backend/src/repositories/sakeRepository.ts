import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import type { SakeMasterItem } from "@sake-app/shared";

export interface SakeRepository {
  getSakeMasterItem(sakeId: string): Promise<SakeMasterItem | undefined>;
}

export class DynamoDbSakeRepository implements SakeRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async getSakeMasterItem(
    sakeId: string,
  ): Promise<SakeMasterItem | undefined> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          sakeId,
        },
      }),
    );

    return result.Item as SakeMasterItem | undefined;
  }
}

let defaultRepository: SakeRepository | undefined;

export function getSakeRepository(): SakeRepository {
  if (defaultRepository) {
    return defaultRepository;
  }

  const tableName = process.env.SAKE_MASTER_TABLE_NAME;

  if (!tableName) {
    throw new Error("SAKE_MASTER_TABLE_NAME is not configured");
  }

  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  defaultRepository = new DynamoDbSakeRepository(documentClient, tableName);

  return defaultRepository;
}

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import type { UserDrinkItem } from "@sake-app/shared";

export interface UserActionRepository {
  putDrink(item: UserDrinkItem): Promise<void>;
}

export class DynamoDbUserActionRepository implements UserActionRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async putDrink(item: UserDrinkItem): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
        ConditionExpression:
          "attribute_not_exists(userId) AND attribute_not_exists(actionKey)",
      }),
    );
  }
}

let defaultRepository: UserActionRepository | undefined;

export function getUserActionRepository(): UserActionRepository {
  if (defaultRepository) {
    return defaultRepository;
  }

  const tableName = process.env.USER_ACTIONS_TABLE_NAME;

  if (!tableName) {
    throw new Error("USER_ACTIONS_TABLE_NAME is not configured");
  }

  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  defaultRepository = new DynamoDbUserActionRepository(
    documentClient,
    tableName,
  );

  return defaultRepository;
}

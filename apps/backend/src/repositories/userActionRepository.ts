import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { UserDrinkItem, UserFavoriteItem } from "@sake-app/shared";

export interface UserActionRepository {
  putDrink(item: UserDrinkItem): Promise<void>;
  findDrinksByUserId(userId: string): Promise<UserDrinkItem[]>;
  findFavoritesByUserId(userId: string): Promise<UserFavoriteItem[]>;
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

  async findDrinksByUserId(userId: string): Promise<UserDrinkItem[]> {
    return this.queryUserActionsByPrefix<UserDrinkItem>(userId, "DRINK#");
  }

  async findFavoritesByUserId(userId: string): Promise<UserFavoriteItem[]> {
    return this.queryUserActionsByPrefix<UserFavoriteItem>(
      userId,
      "FAVORITE#",
    );
  }

  private async queryUserActionsByPrefix<T>(
    userId: string,
    actionKeyPrefix: string,
  ): Promise<T[]> {
    const items: T[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const result = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression:
            "userId = :userId AND begins_with(actionKey, :actionKeyPrefix)",
          ExpressionAttributeValues: {
            ":userId": userId,
            ":actionKeyPrefix": actionKeyPrefix,
          },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );

      items.push(...((result.Items ?? []) as T[]));
      exclusiveStartKey = result.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return items;
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

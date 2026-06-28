import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { UserDrinkItem, UserFavoriteItem } from "@sake-app/shared";

export interface UserActionRepository {
  putDrink(item: UserDrinkItem): Promise<void>;
  putFavorite(item: UserFavoriteItem): Promise<UserFavoriteItem>;
  deleteFavorite(userId: string, sakeId: string): Promise<void>;
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

  async putFavorite(item: UserFavoriteItem): Promise<UserFavoriteItem> {
    const setExpressions = [
      "actionType = :actionType",
      "sakeId = :sakeId",
      "sakeNameSnapshot = :sakeNameSnapshot",
      "createdAt = if_not_exists(createdAt, :createdAt)",
      "updatedAt = :updatedAt",
    ];
    const removeExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {
      ":actionType": item.actionType,
      ":sakeId": item.sakeId,
      ":sakeNameSnapshot": item.sakeNameSnapshot,
      ":createdAt": item.createdAt,
      ":updatedAt": item.updatedAt,
    };

    if (item.breweryNameSnapshot === undefined) {
      removeExpressions.push("breweryNameSnapshot");
    } else {
      setExpressions.push("breweryNameSnapshot = :breweryNameSnapshot");
      expressionAttributeValues[":breweryNameSnapshot"] =
        item.breweryNameSnapshot;
    }

    if (item.flavorSnapshot === undefined) {
      removeExpressions.push("flavorSnapshot");
    } else {
      setExpressions.push("flavorSnapshot = :flavorSnapshot");
      expressionAttributeValues[":flavorSnapshot"] = item.flavorSnapshot;
    }

    if (item.imageUrl === undefined) {
      removeExpressions.push("imageUrl");
    } else {
      setExpressions.push("imageUrl = :imageUrl");
      expressionAttributeValues[":imageUrl"] = item.imageUrl;
    }

    const updateExpressions = [`SET ${setExpressions.join(", ")}`];

    if (removeExpressions.length > 0) {
      updateExpressions.push(`REMOVE ${removeExpressions.join(", ")}`);
    }

    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          userId: item.userId,
          actionKey: item.actionKey,
        },
        UpdateExpression: updateExpressions.join(" "),
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      }),
    );

    return result.Attributes as UserFavoriteItem;
  }

  async deleteFavorite(userId: string, sakeId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          userId,
          actionKey: `FAVORITE#${sakeId}`,
        },
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

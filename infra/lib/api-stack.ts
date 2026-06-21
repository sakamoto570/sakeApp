import { Stack, type StackProps } from "aws-cdk-lib";
import type { IUserPool } from "aws-cdk-lib/aws-cognito";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  sakeMasterTable: ITable;
  userActionsTable: ITable;
  userPool: IUserPool;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda, API Gateway, Cognito authorizer, and Bedrock permissions go here.
  }
}


import {
  CfnOutput,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  Table,
} from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

interface DatabaseStackProps extends StackProps {
  stage: string;
}

export class DatabaseStack extends Stack {
  readonly sakeMasterTable: Table;
  readonly userActionsTable: Table;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    this.sakeMasterTable = new Table(this, "SakeMasterTable", {
      tableName: `${props.stage}-sake-master`,
      partitionKey: { name: "sakeId", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.userActionsTable = new Table(this, "UserActionsTable", {
      tableName: `${props.stage}-user-actions`,
      partitionKey: { name: "userId", type: AttributeType.STRING },
      sortKey: { name: "actionKey", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: false,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, "SakeMasterTableName", {
      value: this.sakeMasterTable.tableName,
      description: "DynamoDB table containing the sake flavor cache",
    });

    new CfnOutput(this, "UserActionsTableName", {
      value: this.userActionsTable.tableName,
      description: "DynamoDB table containing favorites and drink records",
    });
  }
}

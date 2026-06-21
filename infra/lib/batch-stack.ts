import {
  CfnOutput,
  Duration,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import {
  Architecture,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

interface BatchStackProps extends StackProps {
  stage: string;
  enableSchedule: boolean;
  sakeMasterTable: ITable;
}

export class BatchStack extends Stack {
  constructor(scope: Construct, id: string, props: BatchStackProps) {
    super(scope, id, props);

    const currentDirectory = dirname(fileURLToPath(import.meta.url));

    const flavorSyncFunction = new NodejsFunction(this, "FlavorSyncFunction", {
      entry: join(
        currentDirectory,
        "../../../apps/batch/src/handlers/syncFlavorCharts.ts",
      ),
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(90),
      tracing: Tracing.ACTIVE,
      environment: {
        SAKE_MASTER_TABLE_NAME: props.sakeMasterTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    props.sakeMasterTable.grantReadWriteData(flavorSyncFunction);

    const syncFlavorChartsSchedule = new Rule(
      this,
      "SyncFlavorChartsSchedule",
      {
        ruleName: `${props.stage}-sync-flavor-charts-schedule`,
        description: "Synchronize Sakenowa flavor charts every week",
        enabled: props.enableSchedule,
        schedule: Schedule.cron({
          minute: "0",
          hour: "18",
          weekDay: "SUN",
        }),
      },
    );

    syncFlavorChartsSchedule.addTarget(
      new LambdaFunction(flavorSyncFunction),
    );

    new CfnOutput(this, "SyncFlavorChartsScheduleRuleName", {
      value: syncFlavorChartsSchedule.ruleName,
      description: "EventBridge rule for the weekly flavor chart sync",
    });
  }
}

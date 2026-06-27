import { App } from "aws-cdk-lib";

import { ApiStack } from "../lib/api-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { BatchStack } from "../lib/batch-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";

const app = new App();

const stage = app.node.tryGetContext("stage") ?? process.env.CDK_STAGE ?? "dev";
const enableScheduleContext = app.node.tryGetContext("enableSchedule");

if (typeof stage !== "string" || !/^[a-z0-9-]+$/.test(stage)) {
  throw new Error(
    "stage must contain only lowercase letters, numbers, and hyphens",
  );
}

if (
  enableScheduleContext !== undefined &&
  enableScheduleContext !== true &&
  enableScheduleContext !== false &&
  enableScheduleContext !== "true" &&
  enableScheduleContext !== "false"
) {
  throw new Error("enableSchedule must be either true or false");
}

const enableSchedule =
  enableScheduleContext === undefined
    ? stage === "prd"
    : enableScheduleContext === true || enableScheduleContext === "true";

const database = new DatabaseStack(app, `${stage}-SakeAppDatabase`, {
  stage,
});
const auth = new AuthStack(app, `${stage}-SakeAppAuth`, {
  stage,
});

new ApiStack(app, `${stage}-SakeAppApi`, {
  stage,
  sakeMasterTable: database.sakeMasterTable,
  userActionsTable: database.userActionsTable,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
});

new BatchStack(app, `${stage}-SakeAppBatch`, {
  stage,
  enableSchedule,
  sakeMasterTable: database.sakeMasterTable,
});

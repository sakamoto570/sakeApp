import { App } from "aws-cdk-lib";

import { ApiStack } from "../lib/api-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { BatchStack } from "../lib/batch-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { PipelineStack } from "../lib/pipeline-stack.js";

const app = new App();

const stage = app.node.tryGetContext("stage") ?? process.env.CDK_STAGE ?? "dev";
const enableScheduleContext = app.node.tryGetContext("enableSchedule");
const enablePipelineContext = app.node.tryGetContext("enablePipeline");
const bedrockModelId =
  app.node.tryGetContext("bedrockModelId") ?? process.env.BEDROCK_MODEL_ID;
const githubOwner = app.node.tryGetContext("githubOwner") ?? "sakamoto570";
const githubRepo = app.node.tryGetContext("githubRepo") ?? "sakeApp";
const githubBranch = app.node.tryGetContext("githubBranch") ?? "main";
const githubConnectionArn =
  app.node.tryGetContext("githubConnectionArn") ??
  process.env.GITHUB_CONNECTION_ARN;

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

if (
  enablePipelineContext !== undefined &&
  enablePipelineContext !== true &&
  enablePipelineContext !== false &&
  enablePipelineContext !== "true" &&
  enablePipelineContext !== "false"
) {
  throw new Error("enablePipeline must be either true or false");
}

const enableSchedule =
  enableScheduleContext === undefined
    ? stage === "prd"
    : enableScheduleContext === true || enableScheduleContext === "true";
const enablePipeline =
  enablePipelineContext === true || enablePipelineContext === "true";

if (
  enablePipeline &&
  (typeof githubOwner !== "string" ||
    typeof githubRepo !== "string" ||
    typeof githubBranch !== "string" ||
    typeof githubConnectionArn !== "string")
) {
  throw new Error(
    "githubOwner, githubRepo, githubBranch, and githubConnectionArn are required when enablePipeline is true",
  );
}

const database = new DatabaseStack(app, `${stage}-SakeAppDatabase`, {
  stage,
});
const auth = new AuthStack(app, `${stage}-SakeAppAuth`, {
  stage,
});

new ApiStack(app, `${stage}-SakeAppApi`, {
  bedrockModelId:
    typeof bedrockModelId === "string" ? bedrockModelId : undefined,
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

if (enablePipeline) {
  new PipelineStack(app, `${stage}-SakeAppPipeline`, {
    stage,
    githubOwner,
    githubRepo,
    githubBranch,
    githubConnectionArn,
  });
}

import {
  CfnOutput,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import {
  BuildSpec,
  ComputeType,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import {
  Artifact,
  Pipeline,
  PipelineType,
} from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeStarConnectionsSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export interface PipelineStackProps extends StackProps {
  stage: string;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubConnectionArn: string;
  bootstrapQualifier?: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const sourceOutput = new Artifact("SourceOutput");
    const bootstrapQualifier = props.bootstrapQualifier ?? "hnb659fds";
    const cloudFormationExecutionRole = Role.fromRoleName(
      this,
      "CloudFormationExecutionRole",
      `cdk-${bootstrapQualifier}-cfn-exec-role-${this.account}-${this.region}`,
      {
        mutable: true,
      },
    );
    const passConnectionPolicy = new Policy(this, "PassConnectionPolicy", {
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: [
            "codeconnections:PassConnection",
            "codestar-connections:PassConnection",
          ],
          resources: [props.githubConnectionArn],
        }),
      ],
    });

    cloudFormationExecutionRole.attachInlinePolicy(passConnectionPolicy);

    const sourceAction = new CodeStarConnectionsSourceAction({
      actionName: "GitHub_Source",
      owner: props.githubOwner,
      repo: props.githubRepo,
      branch: props.githubBranch,
      connectionArn: props.githubConnectionArn,
      output: sourceOutput,
      triggerOnPush: true,
    });

    const deployProject = new PipelineProject(this, "DeployProject", {
      projectName: `${props.stage}-sake-cdk-deploy`,
      buildSpec: BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            "runtime-versions": {
              nodejs: 22,
            },
            commands: ["npm ci"],
          },
          build: {
            commands: [
              "npm run build -w @sake-app/infra",
              [
                "npx cdk deploy --all",
                "--require-approval never",
                `-c stage=${props.stage}`,
                "-c enablePipeline=true",
                `-c githubOwner=${props.githubOwner}`,
                `-c githubRepo=${props.githubRepo}`,
                `-c githubBranch=${props.githubBranch}`,
                "-c githubConnectionArn=$GITHUB_CONNECTION_ARN",
              ].join(" "),
            ],
          },
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_7_0,
        computeType: ComputeType.SMALL,
        environmentVariables: {
          GITHUB_CONNECTION_ARN: {
            value: props.githubConnectionArn,
          },
        },
      },
    });

    deployProject.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["*"],
        resources: ["*"],
      }),
    );

    const deployAction = new CodeBuildAction({
      actionName: "CDK_Deploy",
      project: deployProject,
      input: sourceOutput,
    });

    const pipeline = new Pipeline(this, "Pipeline", {
      pipelineName: `${props.stage}-sake-main-deploy`,
      pipelineType: PipelineType.V2,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Deploy",
          actions: [deployAction],
        },
      ],
    });
    pipeline.node.addDependency(passConnectionPolicy);

    new CfnOutput(this, "PipelineName", {
      value: pipeline.pipelineName,
      description: "CodePipeline that deploys the CDK app from main",
    });
  }
}

import {
  CfnOutput,
  Duration,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import {
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { IUserPool, IUserPoolClient } from "aws-cdk-lib/aws-cognito";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import {
  Architecture,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface ApiStackProps extends StackProps {
  stage: string;
  sakeMasterTable: ITable;
  userActionsTable: ITable;
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
}

export class ApiStack extends Stack {
  readonly cognitoJwtAuthorizer: HttpJwtAuthorizer;
  readonly httpApi: HttpApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const issuer = `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`;

    this.cognitoJwtAuthorizer = new HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      issuer,
      {
        authorizerName: `${Stack.of(this).stackName}-cognito-jwt-authorizer`,
        jwtAudience: [props.userPoolClient.userPoolClientId],
      },
    );

    const backendFunction = new NodejsFunction(this, "BackendFunction", {
      entry: join(currentDirectory, "../../../apps/backend/src/handler.ts"),
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(30),
      tracing: Tracing.ACTIVE,
      environment: {
        USER_ACTIONS_TABLE_NAME: props.userActionsTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    props.userActionsTable.grantReadWriteData(backendFunction);

    this.httpApi = new HttpApi(this, "HttpApi", {
      apiName: `${props.stage}-sake-api`,
    });

    this.httpApi.addRoutes({
      path: "/drinks",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateDrinkIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/me/sakes",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ListDrunkSakesIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    new CfnOutput(this, "HttpApiEndpoint", {
      value: this.httpApi.apiEndpoint,
      description: "HTTP API endpoint",
    });
  }
}

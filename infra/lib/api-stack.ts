import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { IUserPool, IUserPoolClient } from "aws-cdk-lib/aws-cognito";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import {
  Effect,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import {
  Architecture,
  Runtime,
  Tracing,
} from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  BlockPublicAccess,
  Bucket,
  HttpMethods,
} from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface ApiStackProps extends StackProps {
  stage: string;
  sakeMasterTable: ITable;
  userActionsTable: ITable;
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
  bedrockModelId?: string;
}

export class ApiStack extends Stack {
  readonly cognitoJwtAuthorizer: HttpJwtAuthorizer;
  readonly httpApi: HttpApi;
  readonly drinkImagesBucket: Bucket;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const issuer = `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`;

    this.drinkImagesBucket = new Bucket(this, "DrinkImagesBucket", {
      bucketName: `${props.stage}-drink-images-${this.account}-${this.region}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
          ],
          maxAge: 3000,
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    });

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
        BEDROCK_MODEL_ID:
          props.bedrockModelId ??
          "anthropic.claude-3-haiku-20240307-v1:0",
        SAKE_MASTER_TABLE_NAME: props.sakeMasterTable.tableName,
        USER_ACTIONS_TABLE_NAME: props.userActionsTable.tableName,
        DRINK_IMAGES_BUCKET_NAME: this.drinkImagesBucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node20",
      },
    });

    props.userActionsTable.grantReadWriteData(backendFunction);
    props.sakeMasterTable.grantReadData(backendFunction);
    this.drinkImagesBucket.grantReadWrite(backendFunction);
    backendFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      }),
    );

    this.httpApi = new HttpApi(this, "HttpApi", {
      apiName: `${props.stage}-sake-api`,
      corsPreflight: {
        allowHeaders: ["authorization", "content-type"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
          "http://127.0.0.1:5173",
          "http://127.0.0.1:5174",
          "http://127.0.0.1:5175",
        ],
      },
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
      path: "/favorites",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateFavoriteIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/favorites/{sakeId}",
      methods: [HttpMethod.DELETE],
      integration: new HttpLambdaIntegration(
        "DeleteFavoriteIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/sakes/search",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "SearchSakesIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/sakes/{sakeId}/detail",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "GetSakeDetailIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/sakes/{sakeId}/recommendations",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "ListSakeRecommendationsIntegration",
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

    this.httpApi.addRoutes({
      path: "/images/upload-url",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateImageUploadUrlIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    this.httpApi.addRoutes({
      path: "/images/view-url",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration(
        "CreateImageViewUrlIntegration",
        backendFunction,
      ),
      authorizer: this.cognitoJwtAuthorizer,
    });

    new CfnOutput(this, "HttpApiEndpoint", {
      value: this.httpApi.apiEndpoint,
      description: "HTTP API endpoint",
    });

    new CfnOutput(this, "DrinkImagesBucketName", {
      value: this.drinkImagesBucket.bucketName,
      description: "S3 bucket storing drink label images",
    });
  }
}

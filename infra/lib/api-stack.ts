import { Stack, type StackProps } from "aws-cdk-lib";
import type { IUserPool, IUserPoolClient } from "aws-cdk-lib/aws-cognito";
import { HttpJwtAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import type { ITable } from "aws-cdk-lib/aws-dynamodb";
import type { Construct } from "constructs";

interface ApiStackProps extends StackProps {
  sakeMasterTable: ITable;
  userActionsTable: ITable;
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
}

export class ApiStack extends Stack {
  readonly cognitoJwtAuthorizer: HttpJwtAuthorizer;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const issuer = `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`;

    this.cognitoJwtAuthorizer = new HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      issuer,
      {
        authorizerName: `${Stack.of(this).stackName}-cognito-jwt-authorizer`,
        jwtAudience: [props.userPoolClient.userPoolClientId],
      },
    );

    // TODO: When the HTTP API routes are added, pass cognitoJwtAuthorizer to
    // authenticated routes so Lambda receives requestContext.authorizer.jwt.
  }
}

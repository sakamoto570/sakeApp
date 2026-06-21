import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import {
  AccountRecovery,
  Mfa,
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
} from "aws-cdk-lib/aws-cognito";
import type { Construct } from "constructs";

export interface AuthClientUrls {
  callbackUrls: string[];
  logoutUrls: string[];
}

export interface AuthStackProps extends StackProps {
  stage: string;
  clientUrls?: AuthClientUrls;
}

export class AuthStack extends Stack {
  readonly userPool: UserPool;
  readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const clientUrls = props.clientUrls ?? {
      callbackUrls: ["http://localhost:5173"],
      logoutUrls: ["http://localhost:5173"],
    };

    this.userPool = new UserPool(this, "UserPool", {
      userPoolName: `${props.stage}-sake-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      signInCaseSensitive: false,
      autoVerify: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      mfa: Mfa.OFF,
      passwordPolicy: {
        minLength: 8,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      userPoolClientName: `${props.stage}-sake-user-pool-client`,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: clientUrls.callbackUrls,
        logoutUrls: clientUrls.logoutUrls,
      },
      preventUserExistenceErrors: true,
    });

    new CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
      description: "Cognito User Pool ID for frontend configuration",
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID for frontend configuration",
    });
  }
}

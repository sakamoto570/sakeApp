export interface AuthUser {
  userId: string;
  email?: string;
}

export interface AuthenticatedRequestContext {
  authorizer?: {
    jwt?: {
      claims?: {
        sub?: string;
        email?: string;
        [claim: string]: unknown;
      };
    };
  };
}

export interface AuthenticatedLambdaEvent {
  requestContext?: AuthenticatedRequestContext;
}

export function getAuthenticatedUserId(
  event: AuthenticatedLambdaEvent,
): string | undefined {
  const userId = event.requestContext?.authorizer?.jwt?.claims?.sub;

  return typeof userId === "string" && userId.length > 0
    ? userId
    : undefined;
}

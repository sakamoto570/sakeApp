import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";
import { defineStore } from "pinia";

import { cognitoConfig } from "../api/client";

const STORAGE_KEYS = {
  idToken: "sakeApp.idToken",
  accessToken: "sakeApp.accessToken",
  email: "sakeApp.userEmail",
} as const;

function createUserPool(): CognitoUserPool {
  if (!cognitoConfig.userPoolId || !cognitoConfig.clientId) {
    throw new Error("Cognito の設定が不足しています。環境変数を確認してください。");
  }

  return new CognitoUserPool({
    UserPoolId: cognitoConfig.userPoolId,
    ClientId: cognitoConfig.clientId,
  });
}

function createUser(email: string): CognitoUser {
  return new CognitoUser({
    Username: email,
    Pool: createUserPool(),
  });
}

function getSession(user: CognitoUser): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    user.getSession((error: Error | null, session: CognitoUserSession | null) => {
      if (error || !session) {
        reject(error ?? new Error("Cognito セッションを取得できませんでした。"));
        return;
      }

      resolve(session);
    });
  });
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const [, payload] = token.split(".");

  if (!payload) {
    return {};
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(normalizedPayload)
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );

  return JSON.parse(json) as Record<string, unknown>;
}

function emailFromIdToken(idToken: string): string | null {
  try {
    const payload = decodeJwtPayload(idToken);
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    idToken: localStorage.getItem(STORAGE_KEYS.idToken),
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    userEmail: localStorage.getItem(STORAGE_KEYS.email),
    loading: false,
    error: null as string | null,
    hasRestoredSession: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.idToken),
  },
  actions: {
    async login(email: string, password: string): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const user = createUser(email);
        const details = new AuthenticationDetails({
          Username: email,
          Password: password,
        });

        const session = await new Promise<CognitoUserSession>(
          (resolve, reject) => {
            user.authenticateUser(details, {
              onSuccess: resolve,
              onFailure: reject,
              newPasswordRequired: () => {
                reject(
                  new Error(
                    "新しいパスワード設定が必要なユーザーです。Cognito側で確認してください。",
                  ),
                );
              },
            });
          },
        );

        this.applySession(session, email);
      } catch (error) {
        this.clearSession();
        this.error =
          error instanceof Error ? error.message : "ログインに失敗しました。";
        throw error;
      } finally {
        this.loading = false;
        this.hasRestoredSession = true;
      }
    },

    async signUp(email: string, password: string): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const userPool = createUserPool();
        const attributes = [
          new CognitoUserAttribute({
            Name: "email",
            Value: email,
          }),
        ];

        await new Promise<void>((resolve, reject) => {
          userPool.signUp(email, password, attributes, [], (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      } catch (error) {
        this.error =
          error instanceof Error ? error.message : "新規登録に失敗しました。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async confirmSignUp(email: string, code: string): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const user = createUser(email);

        await new Promise<void>((resolve, reject) => {
          user.confirmRegistration(code, true, (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "確認コードの検証に失敗しました。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async resendSignUpCode(email: string): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        const user = createUser(email);

        await new Promise<void>((resolve, reject) => {
          user.resendConfirmationCode((error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
      } catch (error) {
        this.error =
          error instanceof Error
            ? error.message
            : "確認コードを再送できませんでした。";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    logout(): void {
      try {
        const userPool = createUserPool();
        const currentUser = userPool.getCurrentUser();
        currentUser?.signOut();
      } finally {
        this.clearSession();
        this.hasRestoredSession = true;
      }
    },

    async restoreSession(): Promise<void> {
      if (this.hasRestoredSession) {
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const userPool = createUserPool();
        const currentUser = userPool.getCurrentUser();

        if (!currentUser) {
          this.clearSession();
          return;
        }

        const session = await getSession(currentUser);

        if (!session.isValid()) {
          this.clearSession();
          return;
        }

        this.applySession(session);
      } catch {
        this.clearSession();
      } finally {
        this.loading = false;
        this.hasRestoredSession = true;
      }
    },

    getAuthToken(): string | undefined {
      return this.idToken ?? undefined;
    },

    applySession(session: CognitoUserSession, fallbackEmail?: string): void {
      const idToken = session.getIdToken().getJwtToken();
      const accessToken = session.getAccessToken().getJwtToken();
      const userEmail = emailFromIdToken(idToken) ?? fallbackEmail ?? null;

      this.idToken = idToken;
      this.accessToken = accessToken;
      this.userEmail = userEmail;

      localStorage.setItem(STORAGE_KEYS.idToken, idToken);
      localStorage.setItem(STORAGE_KEYS.accessToken, accessToken);

      if (userEmail) {
        localStorage.setItem(STORAGE_KEYS.email, userEmail);
      } else {
        localStorage.removeItem(STORAGE_KEYS.email);
      }
    },

    clearSession(): void {
      this.idToken = null;
      this.accessToken = null;
      this.userEmail = null;

      localStorage.removeItem(STORAGE_KEYS.idToken);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.email);
    },
  },
});

/**
 * OpenAPI path types — hand-maintained until backend is running.
 * Regenerate with: npm run generate:api (requires backend at localhost:8080)
 */

export interface ProblemDetail {
  type?: string | undefined;
  title?: string | undefined;
  status: number;
  detail?: string | undefined;
  instance?: string | undefined;
}

export interface TokenResponse {
  email: string;
  displayName: string;
}

/** Used for endpoints that return 200/201 with no body. */
type Empty = { content: { "application/json": null } };
type Err = { content: { "application/json": ProblemDetail } };
type Ok<T> = { content: { "application/json": T } };

export type paths = {
  "/api/auth/register": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            email: string;
            password: string;
            displayName: string;
            captchaToken: string;
          };
        };
      };
      responses: { 201: Empty; 409: Err; 422: Err };
    };
  };
  "/api/auth/verify-email": {
    post: {
      requestBody: { content: { "application/json": { token: string } } };
      responses: { 200: Empty; 401: Err };
    };
  };
  "/api/auth/login": {
    post: {
      requestBody: {
        content: {
          "application/json": { email: string; password: string };
        };
      };
      responses: { 200: Ok<TokenResponse>; 401: Err };
    };
  };
  "/api/auth/refresh": {
    post: {
      responses: { 200: Ok<TokenResponse>; 401: Err };
    };
  };
  "/api/auth/logout": {
    post: {
      responses: { 200: Empty };
    };
  };
  "/api/auth/forgot-password": {
    post: {
      requestBody: { content: { "application/json": { email: string } } };
      responses: { 200: Empty };
    };
  };
  "/api/auth/reset-password": {
    post: {
      requestBody: {
        content: {
          "application/json": { token: string; newPassword: string };
        };
      };
      responses: { 200: Empty; 401: Err };
    };
  };
};

export type webhooks = Record<string, never>;
export type components = {
  schemas: Record<string, never>;
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type external = Record<string, never>;
export type operations = Record<string, never>;

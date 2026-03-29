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
  id: string;
  email: string;
  displayName: string;
}

export interface RegistryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string;
  createdAt: string;
}

export interface RegistryInviteResponse {
  token: string;
}

export interface CategoryResponse {
  id: string;
  registryId: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
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
  "/api/registries": {
    get: {
      responses: { 200: Ok<RegistryResponse[]> };
    };
    post: {
      requestBody: {
        content: {
          "application/json": {
            name: string;
            description?: string | null;
            visibility: "PUBLIC" | "PRIVATE";
          };
        };
      };
      responses: { 201: Ok<RegistryResponse>; 403: Err; 422: Err };
    };
  };
  "/api/registries/{slug}": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<RegistryResponse>; 403: Err; 404: Err };
    };
    patch: {
      parameters: { path: { slug: string } };
      requestBody: {
        content: {
          "application/json": {
            name?: string | null;
            description?: string | null;
            visibility?: "PUBLIC" | "PRIVATE" | null;
          };
        };
      };
      responses: { 200: Ok<RegistryResponse>; 403: Err; 404: Err; 422: Err };
    };
    delete: {
      parameters: { path: { slug: string } };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/invite": {
    post: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<RegistryInviteResponse>; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/join": {
    post: {
      parameters: { path: { slug: string } };
      requestBody: {
        content: { "application/json": { token: string } };
      };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/categories": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<CategoryResponse[]> };
    };
    post: {
      parameters: { path: { slug: string } };
      requestBody: {
        content: { "application/json": { name: string } };
      };
      responses: { 201: Ok<CategoryResponse>; 403: Err; 404: Err };
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

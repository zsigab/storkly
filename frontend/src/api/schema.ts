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
  visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
  ownerId: string;
  createdAt: string;
}

export interface RegistryInviteResponse {
  token: string;
}

export interface SubscriberResponse {
  userId: string;
  displayName: string;
  joinedAt: string;
}

export interface CategoryResponse {
  id: string;
  registryId: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
}

export type ItemFlag = "EXACT_ONLY" | "SIMILAR_OK" | "SIMILAR_CHEAPER";
export type SourceSite = "LAZADA_PH" | "SHOPEE_PH" | "AMAZON" | "GALAXUS" | "SM" | "ROBINSONS" | "MANUAL";

export interface LinkPreviewResponse {
  url: string;
  supported: boolean;
  sourceSite: SourceSite;
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  priceReference: number | null;
  currency: string | null;
}

export interface ImageUploadResponse {
  url: string;
}

export interface ItemResponse {
  id: string;
  registryId: string;
  categoryId: string | null;
  addedByUserId: string | null;
  urlOriginal: string | null;
  sourceSite: SourceSite;
  title: string;
  description: string | null;
  imageUrl: string | null;
  priceReference: number | null;
  currency: string | null;
  priceCapturedAt: string | null;
  quantityDesired: number;
  flag: ItemFlag;
  notes: string | null;
  sortOrder: number;
  alreadyOwned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimResponse {
  id: string;
  itemId: string;
  claimerUserId: string | null;
  claimerName: string | null;
  claimerEmail: string | null;
  quantityClaimed: number;
  amountContributed: number | null;
  percentageContributed: number | null;
  claimedAt: string;
}

/** Used for endpoints that return 200/201 with no body. */
type Empty = { content: { "application/json": null } };
type Err = { content: { "application/json": ProblemDetail } };
type Ok<T> = { content: { "application/json": T } };

export type paths = {
  "/api/auth/me": {
    get: {
      responses: { 200: Ok<TokenResponse>; 401: Err };
    };
  };
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
            visibility: "PUBLIC" | "PRIVATE" | "HIDDEN";
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
            visibility?: "PUBLIC" | "PRIVATE" | "HIDDEN" | null;
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
  "/api/registries/{slug}/subscription": {
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
  "/api/registries/{slug}/subscribers": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<SubscriberResponse[]>; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/items": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<ItemResponse[]>; 403: Err; 404: Err };
    };
    post: {
      parameters: { path: { slug: string } };
      requestBody: {
        content: {
          "application/json": {
            title: string;
            description?: string | null;
            urlOriginal?: string | null;
            imageUrl?: string | null;
            priceReference?: number | null;
            currency?: string | null;
            categoryId?: string | null;
            flag: ItemFlag;
            quantityDesired: number;
            notes?: string | null;
            alreadyOwned?: boolean;
          };
        };
      };
      responses: { 201: Ok<ItemResponse>; 403: Err; 404: Err; 422: Err };
    };
  };
  "/api/items/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<ItemResponse>; 403: Err; 404: Err };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: {
        content: {
          "application/json": {
            title?: string | null;
            description?: string | null;
            urlOriginal?: string | null;
            imageUrl?: string | null;
            priceReference?: number | null;
            currency?: string | null;
            categoryId?: string | null;
            flag?: ItemFlag | null;
            quantityDesired?: number | null;
            notes?: string | null;
            sortOrder?: number | null;
            alreadyOwned?: boolean | null;
          };
        };
      };
      responses: { 200: Ok<ItemResponse>; 403: Err; 404: Err; 422: Err };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/items/{id}/claims": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<ClaimResponse[]> };
    };
    post: {
      parameters: { path: { id: string } };
      requestBody: {
        content: {
          "application/json": {
            claimerName?: string | null;
            claimerEmail?: string | null;
            quantityClaimed: number;
            amountContributed?: number | null;
            percentageContributed?: number | null;
          };
        };
      };
      responses: { 201: Ok<ClaimResponse>; 400: Err; 409: Err };
    };
  };
  "/api/claims/{value}": {
    delete: {
      parameters: { path: { value: string } };
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
  "/api/link-preview": {
    post: {
      requestBody: {
        content: { "application/json": { url: string } };
      };
      responses: { 200: Ok<LinkPreviewResponse>; 401: Err; 422: Err };
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

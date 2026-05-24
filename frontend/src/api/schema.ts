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
  themeColor: string;
  themeBackground: string;
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
  registryId: string | null;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  isSystem: boolean;
}

export type ItemFlag = "EXACT_ONLY" | "SIMILAR_OK" | "SIMILAR_CHEAPER";
export type ItemType = "PRODUCT" | "FUND";
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
  itemType: ItemType;
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
  confirmedAt: string | null;
  deliveryOptionId: string | null;
  deliveryType: string | null;
  receivedAt: string | null;
  amountReceived: number | null;
  releasedAt: string | null;
}

export interface MyClaimResponse {
  claimId: string;
  itemId: string;
  itemTitle: string;
  registryName: string;
  registrySlug: string;
  quantityClaimed: number;
  amountContributed: number | null;
  percentageContributed: number | null;
  deliveryOptionId: string | null;
  deliveryType: string | null;
  claimedAt: string;
  receivedAt: string | null;
}

export interface DeliveryOptionResponse {
  id: string;
  registryId: string;
  type: string;
  label: string;
  description: string | null;
  enabled: boolean;
  sortOrder: number;
  eventId: string | null;
}

export interface EventTimeSlotResponse {
  id: string;
  slotTime: string;
  slotOffsetSeconds: number | null;
  capacity: number | null;
  attendingCount: number;
}

export interface EventTimeSlotPublicResponse {
  id: string;
  slotTime: string;
  slotOffsetSeconds: number | null;
  spotsLeft: number | null;
}

export interface EventResponse {
  id: string;
  title: string;
  eventDate: string;
  eventDateOffsetSeconds: number | null;
  location: string | null;
  description: string | null;
  rsvpToken: string;
  rsvpShortCode: string | null;
  rsvpCapacity: number | null;
  attendees: RsvpResponse[];
  timeSlots: EventTimeSlotResponse[];
  themeColor: string;
  themeBackground: string;
  createdAt: string;
}

export interface EventPublicResponse {
  id: string;
  title: string;
  eventDate: string;
  eventDateOffsetSeconds: number | null;
  location: string | null;
  description: string | null;
  themeColor: string;
  themeBackground: string;
}

export interface RsvpResponse {
  id: string;
  displayName: string;
  email: string;
  attending: boolean;
  confirmedAt: string | null;
  timeSlotTime: string | null;
  timeSlotOffsetSeconds: number | null;
}

export interface RsvpPublicEventResponse {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventDateOffsetSeconds: number | null;
  location: string | null;
  description: string | null;
  themeColor: string;
  themeBackground: string;
  spotsLeft: number | null;
  timeSlots: EventTimeSlotPublicResponse[];
}

export interface RsvpConfirmResponse {
  eventId: string;
}

export interface RsvpShortLinkResponse {
  shortCode: string;
}

export interface RsvpShortLinkLookupResponse {
  rsvpToken: string;
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
          "application/json": { email: string; password: string; rememberMe?: boolean };
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
      requestBody: { content: { "application/json": { email: string; captchaToken: string } } };
      responses: { 200: Empty };
    };
  };
  "/api/auth/request-password-reset": {
    post: {
      responses: { 200: Empty; 401: Err };
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
            themeColor?: string | null;
            themeBackground?: string | null;
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
            themeColor?: string | null;
            themeBackground?: string | null;
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
            itemType?: ItemType;
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
            itemType?: ItemType | null;
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
            deliveryOptionId?: string | null;
          };
        };
      };
      responses: { 201: Ok<ClaimResponse>; 400: Err; 409: Err };
    };
  };
  "/api/claims/mine": {
    get: {
      responses: { 200: Ok<MyClaimResponse[]>; 401: Err };
    };
  };
  "/api/items/{id}/claim-history": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<ClaimResponse[]>; 403: Err; 404: Err };
    };
  };
  "/api/claims/{id}/reset": {
    patch: {
      parameters: { path: { id: string } };
      responses: { 204: Empty; 403: Err; 404: Err; 409: Err };
    };
  };
  "/api/claims/{token}/confirm": {
    post: {
      parameters: { path: { token: string } };
      responses: { 204: Empty; 404: Err; 409: Err };
    };
  };
  "/api/claims/{id}/receive": {
    patch: {
      parameters: { path: { id: string } };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/claims/{id}/delivery-option": {
    patch: {
      parameters: { path: { id: string } };
      requestBody: {
        content: { "application/json": { deliveryOptionId?: string | null } };
      };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/claims/{value}": {
    delete: {
      parameters: { path: { value: string } };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/claims": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<ClaimResponse[]>; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/item-claims": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<ClaimResponse[]>; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/claim-history": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<ClaimResponse[]>; 403: Err; 404: Err };
    };
  };
  "/api/registries/{slug}/delivery-options": {
    get: {
      parameters: { path: { slug: string } };
      responses: { 200: Ok<DeliveryOptionResponse[]> };
    };
    post: {
      parameters: { path: { slug: string } };
      requestBody: {
        content: {
          "application/json": {
            type: string;
            label: string;
            description?: string | null;
            enabled: boolean;
            sortOrder: number;
            eventId?: string | null;
          };
        };
      };
      responses: { 201: Ok<DeliveryOptionResponse>; 403: Err; 404: Err; 422: Err };
    };
  };
  "/api/registries/{slug}/delivery-options/{id}": {
    put: {
      parameters: { path: { slug: string; id: string } };
      requestBody: {
        content: {
          "application/json": {
            type: string;
            label: string;
            description?: string | null;
            enabled: boolean;
            sortOrder: number;
            eventId?: string | null;
          };
        };
      };
      responses: { 200: Ok<DeliveryOptionResponse>; 403: Err; 404: Err; 422: Err };
    };
    delete: {
      parameters: { path: { slug: string; id: string } };
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
  "/api/users/me/display-name": {
    patch: {
      requestBody: {
        content: { "application/json": { displayName: string } };
      };
      responses: { 200: Ok<TokenResponse>; 401: Err; 422: Err };
    };
  };
  "/api/events/rsvped": {
    get: {
      responses: { 200: Ok<EventPublicResponse[]>; 401: Err };
    };
  };
  "/api/events": {
    get: {
      responses: { 200: Ok<EventResponse[]>; 401: Err };
    };
    post: {
      requestBody: {
        content: {
          "application/json": {
            title: string;
            eventDate: string;
            eventDateOffsetSeconds?: number | null;
            location?: string | null;
            themeColor?: string | null;
            themeBackground?: string | null;
          };
        };
      };
      responses: { 201: Ok<EventResponse>; 401: Err; 422: Err };
    };
  };
  "/api/events/{id}": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<EventResponse>; 401: Err; 403: Err; 404: Err };
    };
    patch: {
      parameters: { path: { id: string } };
      requestBody: {
        content: {
          "application/json": {
            title?: string | null;
            eventDate?: string | null;
            eventDateOffsetSeconds?: number | null;
            location?: string | null;
            themeColor?: string | null;
            themeBackground?: string | null;
          };
        };
      };
      responses: { 200: Ok<EventResponse>; 401: Err; 403: Err; 404: Err; 422: Err };
    };
    delete: {
      parameters: { path: { id: string } };
      responses: { 204: Empty; 401: Err; 403: Err; 404: Err };
    };
  };
  "/api/events/{id}/public": {
    get: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<EventPublicResponse>; 404: Err };
    };
  };
  "/api/events/{id}/slots": {
    post: {
      parameters: { path: { id: string } };
      requestBody: {
        content: {
          "application/json": {
            slotTime: string;
            slotOffsetSeconds?: number | null;
            capacity?: number | null;
          };
        };
      };
      responses: { 201: Ok<EventTimeSlotResponse>; 403: Err; 404: Err };
    };
  };
  "/api/events/{id}/slots/{slotId}": {
    put: {
      parameters: { path: { id: string; slotId: string } };
      requestBody: {
        content: {
          "application/json": {
            slotTime: string;
            slotOffsetSeconds?: number | null;
            capacity?: number | null;
          };
        };
      };
      responses: { 200: Ok<EventTimeSlotResponse>; 403: Err; 404: Err };
    };
    delete: {
      parameters: { path: { id: string; slotId: string } };
      responses: { 204: Empty; 403: Err; 404: Err };
    };
  };
  "/api/events/{id}/rsvps/{rsvpId}": {
    delete: {
      parameters: { path: { id: string; rsvpId: string } };
      responses: { 204: Empty; 401: Err; 403: Err; 404: Err };
    };
  };
  "/api/events/{id}/rsvp-link": {
    post: {
      parameters: { path: { id: string } };
      responses: { 200: Ok<RsvpShortLinkResponse>; 401: Err; 403: Err; 404: Err; 409: Err };
    };
  };
  "/api/rsvp-link/{code}": {
    get: {
      parameters: { path: { code: string } };
      responses: { 200: Ok<RsvpShortLinkLookupResponse>; 404: Err };
    };
  };
  "/api/rsvp/{rsvpToken}": {
    get: {
      parameters: { path: { rsvpToken: string } };
      responses: { 200: Ok<RsvpPublicEventResponse>; 404: Err };
    };
    post: {
      parameters: { path: { rsvpToken: string } };
      requestBody: {
        content: {
          "application/json": {
            displayName: string;
            email: string;
            attending: boolean;
            captchaToken: string;
            timeSlotId?: string | null;
          };
        };
      };
      responses: { 200: Empty; 404: Err; 409: Err; 422: Err };
    };
  };
  "/api/rsvp/confirm/{confirmToken}": {
    get: {
      parameters: { path: { confirmToken: string } };
      responses: { 200: Ok<RsvpConfirmResponse>; 404: Err };
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

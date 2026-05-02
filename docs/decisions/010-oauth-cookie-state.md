# ADR-010: Cookie-based OAuth2 Authorization Request State

**Date:** 2026-05-01  
**Status:** Accepted

## Context

Spring Security's OAuth2 client stores the in-flight authorization request (state, nonce, PKCE
verifier) in `HttpSession` by default. The Storkly security filter chain uses
`SessionCreationPolicy.STATELESS`, so no session is available.

## Decision

Implement `HttpCookieOAuth2AuthorizationRequestRepository`, which serializes the
`OAuth2AuthorizationRequest` (Java `Serializable`) to a Base64-encoded httpOnly cookie with:

- `SameSite=Lax` — required so the browser sends the cookie when Google redirects back
  (a top-level cross-site GET navigation); `Strict` would suppress it.
- `Max-Age=180` — 3 minutes; long enough for a user to complete the consent screen.
- `HttpOnly=true` — not accessible from JavaScript.

The alternative was to change the session policy to `IF_REQUIRED`, allowing Spring to create a
session just for the OAuth flow. The cookie approach was preferred because it keeps the session
layer genuinely absent rather than conditionally present.

## Trade-offs

**Accepted:** Java serialization of `OAuth2AuthorizationRequest` is used. This carries a theoretical
deserialization risk if the cookie is tampered with. In practice the risk is low: the cookie is
httpOnly, short-lived, and the OAuth state is independently validated by Spring Security against
the value Google returns. Migrating to Jackson-based serialization is straightforward if needed.

**Not chosen:** Session-based storage (`IF_REQUIRED`) — avoids serialization entirely but
re-introduces server-side session state, which conflicts with the stateless JWT architecture.

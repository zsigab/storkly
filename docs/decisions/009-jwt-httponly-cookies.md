# ADR 009 — JWT stored in httpOnly cookies, not localStorage

**Status:** Accepted
**Date:** 2026-03-28

## Context

The Phase 1C2 API client scaffolding stored JWT tokens in `localStorage` and sent them
via `Authorization: Bearer` headers. AGENTS.md specifies httpOnly cookies.

## Decision

Use httpOnly cookies for both access token and refresh token. The browser attaches them
automatically; no JavaScript can read them (XSS-proof).

- `access_token` cookie: HttpOnly, SameSite=Strict, Path=/, MaxAge=900
- `refresh_token` cookie: HttpOnly, SameSite=Strict, Path=/api/auth/refresh, MaxAge=604800

The frontend API client sets `credentials: "include"` so cookies are sent cross-origin.
The `saveTokens`/`clearTokens`/`getAccessToken` helpers in `client.ts` are removed.

## Consequences

- XSS cannot steal tokens
- CSRF is mitigated by SameSite=Strict
- The frontend does not need to manage token state — the browser handles it
- Logout works by clearing the cookies server-side

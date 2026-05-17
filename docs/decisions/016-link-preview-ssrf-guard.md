# ADR-016: SSRF Guard for Link Preview Scraper

**Status:** Accepted
**Date:** 2026-05-17

## Context

The `/api/link-preview` endpoint accepts an arbitrary URL from an authenticated user
and fetches it server-side via Jsoup. Before this change there were no protections:

- `OgLinkPreviewScraper.supports()` returned `true` for any non-null URL (including
  `file://`, `gopher://`, etc.).
- `JsoupScraper` called `Jsoup.connect(url).get()` directly, which follows redirects
  and performs no URL validation. Anyone could submit
  `http://169.254.169.254/latest/meta-data/` (cloud metadata), `http://10.0.0.1/`
  (internal network), or use a 302 redirect from an attacker-owned domain to reach
  the same.
- `IkeaScraper.supports()` used `url.contains("ikea.com")`, trivially bypassable with
  `https://evil.com/?fake=ikea.com`.
- `GlobalExceptionHandler.handleScrapingException` echoed `ex.getMessage()` back to the
  client, turning the endpoint into a port/host scanner (distinguishable
  "Connection refused" vs "timeout" vs "Connection reset" signals leak internal
  topology).

## Decision

Introduce `SsrfGuard` and tighten the scraper layer:

1. **`SsrfGuard.check(url)`** is called before every outbound fetch and on every redirect
   hop. It rejects:
   - Schemes other than `http`/`https`.
   - Ports outside `{80, 443, 8080, 8443}`.
   - Hostnames that resolve to any of: loopback (`127.0.0.0/8`, `::1`), link-local
     (`169.254.0.0/16`, includes AWS/GCP/Azure metadata `169.254.169.254`), private
     ranges (`10/8`, `172.16/12`, `192.168/16` — covered by Java's
     `isSiteLocalAddress`), IPv4 CGNAT (`100.64.0.0/10`), IPv6 ULA (`fc00::/7`),
     multicast, and any-local / wildcard addresses.
2. **Redirects are no longer auto-followed.** `JsoupScraper` switches from
   `connect().get()` to `connect().execute()` with `followRedirects(false)` and walks
   up to 3 redirect hops manually, re-running `SsrfGuard.check` on each `Location`.
3. **Response size is capped** at 2 MB via `Connection.maxBodySize`.
4. **`OgLinkPreviewScraper.supports()`** now only matches URLs with an `http`/`https`
   scheme, so non-web URLs never reach the network layer.
5. **`IkeaScraper.supports()`** parses the URL with `java.net.URI` and matches
   `host.equalsIgnoreCase("ikea.com") || host.toLowerCase().endsWith(".ikea.com")`.
6. **`GlobalExceptionHandler`** returns a fixed generic message
   (`"Unable to fetch link preview"`) for `ScrapingException` and logs the real cause
   server-side.

## Trade-offs

**Accepted:** Best-effort against DNS rebinding. Jsoup re-resolves the hostname when
opening the socket, so a TTL=0 record can change between the `SsrfGuard` check and
the fetch. Pinning to a resolved IP would require setting the `Host` header manually
and breaks SNI/cert validation for HTTPS, which is a worse trade. The rebinding
window is short and the rest of the protections (port + scheme + size + redirect
re-validation) limit blast radius.

**Accepted:** Disabling Jsoup's auto-redirect costs ~10 lines of redirect-walk code,
but is necessary so each hop runs through `SsrfGuard`.

**Not chosen:** A static host allowlist. Was considered but Phase 2 scrapers need to
fetch many merchant sites; maintaining a list is impractical. The dynamic check
(public IP only) covers the actual threat.

## Consequences

- `Connection refused` vs `timeout` errors no longer leak through the API; the client
  always sees the same generic 422 detail. Operators see the real cause in logs.
- Any future `JsoupScraper` subclass inherits the guard automatically.
- `SsrfGuard` is a static utility so it can be unit-tested without Spring context.

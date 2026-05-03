# ADR-012: Drop Playwright — OG tags + JSON-LD for link preview

**Status:** Accepted  
**Date:** 2026-05-03

---

## Context

Phase 2C originally planned to use Playwright (headless Chromium) to render JS-heavy pages like Lazada PH and Shopee PH before extracting product data. A Playwright dependency was added and a `PlaywrightScraper` + `LazadaPhScraper` were partially implemented.

Problems discovered:

1. **Playwright in Docker is heavyweight.** Installing Chromium inside the runtime image adds ~400 MB and requires running `install-deps` as root, complicating the Dockerfile significantly.
2. **Spring Boot nested JAR + Playwright incompatibility.** Playwright's driver-bundle uses `ZipFile` to extract the Node.js binary, which requires a real `file:` URL. Spring Boot's fat JAR uses a `nested:` URL scheme, causing `ZipException` at runtime. The workaround (exploding the JAR in the image) adds complexity without benefit.
3. **OG tags are sufficient for the use-case.** The goal of Phase 2C is to *pre-fill the item form*, not to perform a full product data extraction. Lazada PH, Shopee PH, Amazon, and Galaxus all serve OG meta-tags and JSON-LD (`Product` / `Offer` schema) in their server-rendered HTML, accessible via a simple `User-Agent: facebookexternalhit/1.1` HTTP request with Jsoup.

Validated against real Lazada PH product pages: OG tags return title, image URL, price, and description reliably.

---

## Decision

Drop Playwright entirely from the codebase. Implement Phase 2C link preview using:

- **Jsoup** HTTP fetch with `facebookexternalhit/1.1` UA and `Accept-Language: en-US,en;q=0.9`
- **OG meta tags** (`og:title`, `og:image`, `og:description`, `og:url`) for basic fields
- **JSON-LD** (`application/ld+json` script tags, `Product` + `Offer` / `AggregateOffer` schema) for price and currency
- **Caffeine** cache (500 entries, 1h TTL) on `LinkPreviewService` via Spring `@Cacheable`
- Endpoint renamed from `/api/scrape/preview` → `/api/link-preview`

For Phase 2D–2H full deep scrapers (not yet implemented), the method for JS-rendered pages will be re-evaluated at that time. Playwright remains an option but is not in the codebase until proven necessary.

---

## Consequences

- **Positive:** Dockerfile is simple again (copy JAR, run `java -jar`). No root-level browser install. Runtime image is ~400 MB smaller.
- **Positive:** Link preview works for any URL that serves OG tags — not limited to a whitelist.
- **Positive:** Caching at the service layer avoids redundant HTTP fetches for the same URL.
- **Negative:** Sites that render product data exclusively via client-side JS (no SSR OG tags) will return `supported: false`. The user fills in those fields manually. This is acceptable for the form pre-fill use-case.
- **Deferred:** Full per-site deep scraping (Phase 2D–2H) may reintroduce a headless browser if OG tags prove insufficient for price accuracy. Playwright can be re-added at that point.

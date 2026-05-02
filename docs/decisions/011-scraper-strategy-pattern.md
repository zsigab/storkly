# ADR-011: Scraper Interface Design — Strategy Pattern with Spring Bean List

**Status:** Accepted
**Date:** 2026-05-02

## Context

Phase 2C introduces a scraping layer. We need to dispatch a URL to the right scraper
(Lazada, Shopee, Amazon, etc.) and fall back gracefully when no scraper supports the URL.

## Decision

Use the **strategy pattern** via a `List<Scraper>` injected by Spring:

- `Scraper` interface: `boolean supports(String url)` + `ScrapeResult scrape(String url)`
- `JsoupScraper` abstract base class handles HTTP fetch via Jsoup; subclasses implement `extract()`
- `ScraperDispatcher` `@Service` receives `List<Scraper>` from Spring and iterates in declaration order

Each concrete scraper (2D–2H) is a `@Component` that registers itself automatically. No factory,
no enum switch, no if-chain. Adding a new scraper requires only a new class.

## Alternatives considered

**Single ScraperService with a switch/if-chain on URL pattern** — simpler initially but requires
modifying a central file for every new scraper (violates open/closed). Rejected.

**Dedicated ScraperFactory bean** — adds indirection without benefit since Spring's
`List<Scraper>` injection already provides ordered collection. Rejected.

## Consequences

- Declaration order of `@Component` beans determines scraper priority; more specific
  scrapers (Lazada PH) should be declared before generic fallbacks.
- The dispatcher returns `ScrapeResult.unsupported(url)` for unrecognised URLs, enabling
  the frontend to show a manual-entry fallback.
- `ScrapingException` (runtime) maps to HTTP 422 in `GlobalExceptionHandler` — a failed
  fetch is treated as a client-side concern (bad URL, blocked site).

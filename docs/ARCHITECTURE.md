# Storkly — Architecture Design Document

**Version:** 0.5 (Drop H2, records over @Value, ADR refs in commits)
**Date:** 2026-03-27
**License:** Private (GPL-3.0 on open-source release — see ADR-004)

---

## 1. Executive Summary

Storkly is a self-hosted, open-source gift registry web application. Users create wishlists and add items via URL or manually. Friends and family browse the registry via a shareable invite link, and claim items to prevent duplicate purchases. Designed for personal use (initially), cloud-first deployment on Hetzner, with a soft peachy default theme and comfortable dark mode.

---

## 2. Stakeholders

| Role | Description |
|---|---|
| **Registry Owner** | Creates and manages registries; can act as proxy for others |
| **Gifter / Subscriber** | Invited via link; browses and claims items |
| **Admin** | Site-wide account management (same person as owner for personal use) |

---

## 3. Functional Requirements

### 3.1 User Accounts & Authentication

| ID | Requirement | Phase |
|---|---|---|
| F-01 | Email + password registration with email verification | 1 |
| F-02 | CAPTCHA on registration (Cloudflare Turnstile — free) | 1 |
| F-03 | Password reset via email | 1 |
| F-04 | OAuth scaffolding (Spring Authorization Server config, no providers wired) | 1 |
| F-05 | Google OAuth login | 2 |
| F-06 | Facebook OAuth login | 2 |
| F-07 | Anyone can register; email verification required | 1 |
| F-08 | Subscribing to a private registry requires an invite link | 1 |

### 3.2 Registry Management

| ID | Requirement | Phase |
|---|---|---|
| F-10 | User can create multiple registries | 1 |
| F-11 | Each registry has a unique shareable invite link | 1 |
| F-12 | Registry can be public, private (invite + account), or hidden (owner + co-owners only) | 1 |
| F-13 | Owner can edit registry name, description, visibility | 1 |
| F-14 | Owner can delete a registry (name-confirmation popup, like GitHub repo deletion) | 1 |
| F-15 | Registry page shows subscriber list (owner view) | 1 |
| F-16 | Subscriber can unsubscribe from a registry via dashboard | 1 |

### 3.3 Item Management

| ID | Requirement | Phase |
|---|---|---|
| F-20 | Add item manually (title, image URL, price, link, notes) | 1 |
| F-21 | Add item by pasting URL — URL stored; scraping deferred | 1 |
| F-22 | Auto-scrape product data (title, image, price) from supported sites | 2 |
| F-23 | Cross-marketplace search for lowest price | 2 |
| F-24 | Manual entry fallback for unsupported sites | 1 |
| F-25 | Owner can edit any item field | 1 |
| F-26 | Desired quantity per item (default: 1) | 1 |
| F-27 | Assign item to category | 1 |
| F-28 | Reorder items within a category | 1 |
| F-29 | Delete / archive items (blocked if item has claims) | 1 |
| F-30 | No automatic price re-scanning (price captured once at add time) | — |

### 3.4 Item Flags

Set by the registry owner. Mutually exclusive. Default: **Exact Only**.

| Flag | Meaning to Gifter |
|---|---|
| **Exact Only** | Please buy exactly this product/variant |
| **Similar OK** | A functionally equivalent product is welcome |
| **Similar but Cheaper** | A cheaper alternative is preferred |

### 3.5 Categories

Default set (pre-seeded):

> Nursery & Sleep · Feeding · Diapering · Bath & Skincare · Clothing & Shoes ·
> Gear & Travel · Toys & Play · Health & Safety · Books & Media · Postpartum · Miscellaneous

Owners can add, rename, reorder, and delete custom categories per registry.

### 3.6 Supported Marketplaces (Phase 2 Scraping Whitelist)

| Site | Region | Method |
|---|---|---|
| Lazada PH | Philippines | Playwright (JS-rendered) |
| Shopee PH | Philippines | Playwright (JS-rendered) |
| Amazon | Global | Jsoup + JSON-LD |
| Galaxus | CH / DE / AT | Jsoup + JSON-LD |
| SM Superstores | Philippines | Jsoup (best-effort) |
| Robinsons | Philippines | Jsoup (best-effort) |

Unsupported URL → user is informed and offered manual entry pre-filled with the URL.

### 3.7 Claiming Flow

| ID | Requirement | Phase |
|---|---|---|
| F-40 | Public registries: view without account | 1 |
| F-41 | Claim item: logged in, or anonymous (name + email required) | 1 |
| F-42 | Anonymous claimers receive email with un-claim token link | 1 |
| F-43 | Logged-in gifters manage claims in their profile | 1 |
| F-44 | Other gifters see "Someone is getting this" — identity hidden | 1 |
| F-45 | Registry owner sees full claimer details | 1 |
| F-46 | Partial quantity claiming ("I'll get 2 of the 5 needed") | 2 |
| F-47 | Private registries: invite link + account required | 1 |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NF-01 | Cloud-first on Hetzner VPS, Docker Compose |
| NF-02 | HTTPS via Caddy + Let's Encrypt |
| NF-03 | Free / near-free to operate |
| NF-04 | Private for now; GPL-3.0 on open-source release (ADR-004) |
| NF-05 | Mobile-first responsive |
| NF-06 | WCAG 2.1 AA baseline |
| NF-07 | Page loads < 2s |
| NF-08 | Themeable: peachy default + dark mode (not pure black) |
| NF-09 | Portfolio-quality code: tested, clean architecture |
| NF-10 | Local dev: Spring Boot in distrobox, PostgreSQL on host via Podman |
| NF-11 | Testcontainers for integration tests; DataSeeder for UI development (`SEED_DATA=true`) |

---

## 5. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Spring Boot 4, Java 26 | Owner's expertise; excellent auth/scraping/scheduling support |
| **Frontend** | React 19 + Vite + TypeScript (strict) | Modern, fast, familiar to owner |
| **API** | REST + OpenAPI (springdoc-openapi) | Sufficient scope; codegen eliminates manual TS type sync |
| **TS Client** | openapi-typescript + typed fetch wrapper | Generates types from Spring OpenAPI spec |
| **UI** | Shadcn/UI + Tailwind CSS v4 | CSS-variable theming; dark mode; Radix primitives |
| **Fonts** | Geist (open-source, Vercel) | Clean, modern, good readability |
| **Database** | PostgreSQL 16 (all profiles — ADR-007) | Relational fits domain; no H2 dialect mismatch |
| **ORM / Query** | JOOQ OSS + Flyway | Typesafe SQL DSL; free for PostgreSQL (even commercially); Flyway owns schema |
| **Auth** | Spring Security + Spring Authorization Server | Email/password now; OAuth2 (Google + Facebook) in Phase 2 |
| **Passwords** | `Argon2PasswordEncoder` (Spring Security crypto) | OWASP recommended; no custom crypto |
| **CAPTCHA** | Cloudflare Turnstile | Free, privacy-friendly, no image puzzles |
| **Scraping** | Playwright (Java) + Jsoup | Phase 2; Playwright for JS-rendered sites |
| **Email** | Spring Mail + Mailpit (local dev) / Brevo (prod) | Verification, claim notifications |
| **Reverse proxy** | Caddy 2 | Auto Let's Encrypt; minimal config |
| **Containers** | Docker + Docker Compose | Same Compose file for Colima and Hetzner |
| **Version control** | Git, hosted on GitHub | Frequent checkpoint commits |
| **Build** | Gradle (Kotlin DSL), multi-module | Cleaner than Maven multi-module |
| **Code style** | Spotless (Gradle, Palantir Java Format) + Prettier (frontend) | Enforced at build time; pre-configured |
| **Lombok** | `@RequiredArgsConstructor`, `@Slf4j`, `@Builder` | No constructor boilerplate; DTOs use Java records (ADR-008) |

### Backend Module Structure

```
backend/                    ← Gradle root
  util/                     ← Pure Java, zero Spring deps (SlugUtil, TokenUtil, ...)
  domain/                   ← Entities, repository interfaces, enums, domain exceptions
  service/                  ← Application services + @Component helpers
  scraper/                  ← Phase 2 scrapers (Playwright + Jsoup)
  web/                      ← Spring Boot main class, controllers, DTOs, security config
```

Dependency graph: `util ← domain ← service ← web`
`scraper` depends on `domain + util`, is wired into `web`.

### UI Theming

```css
/* globals.css */
:root {
  --background:          30 100% 98%;  /* warm off-white   */
  --foreground:          20  14% 20%;  /* soft dark brown  */
  --primary:             15  85% 68%;  /* peachy coral     */
  --primary-foreground:   0   0% 100%;
  --muted:               30  40% 94%;
  --radius:              0.75rem;      /* round corners    */
}
.dark {
  --background:         220  15% 16%; /* muted navy-grey, not pure black */
  --foreground:         220  10% 88%;
  --primary:             15  75% 65%; /* muted peach on dark bg */
  --muted:              220  12% 22%;
}
```

---

## 6. System Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                Hetzner CX22 VPS  /  Colima (local)          │
│                                                             │
│  ┌─────────┐    ┌──────────────────────┐    ┌───────────┐  │
│  │  Caddy  │───▶│   Spring Boot API    │───▶│ PostgreSQL│  │
│  │ :80/443 │    │   :8080              │    │  :5432    │  │
│  └─────────┘    │                      │    └───────────┘  │
│       │         │  REST API            │                   │
│       │         │  Spring Security     │    ┌───────────┐  │
│       ▼         │  ScraperService (P2) │───▶│ Playwright│  │
│  ┌─────────┐    │  Email (async)       │    │ (Phase 2) │  │
│  │  React  │    └──────────────────────┘    └───────────┘  │
│  │  SPA    │                                               │
│  │ (static)│    ┌──────────────────────┐                   │
│  └─────────┘    │ Mailpit (local dev)  │                   │
│                 │ Brevo (prod)         │                   │
│                 └──────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

React is built to static files and served directly by Caddy. No Node.js process in production.

---

## 7. Data Model

```
User
  id (UUID), email, password_hash, display_name,
  email_verified_at, provider (LOCAL | GOOGLE | FACEBOOK),
  provider_id, role (USER | ADMIN), created_at

Registry
  id (UUID), owner_id → User, name, slug (unique URL-safe),
  description, visibility (PUBLIC | PRIVATE | HIDDEN), created_at

RegistryCoOwner
  registry_id → Registry, user_id → User, added_at
  (co-owners can add/edit items; owner manages co-owner list)

RegistryInvite
  id, registry_id → Registry, token (unique), created_at, used_at

RegistrySubscription
  user_id → User, registry_id → Registry, joined_at

Category
  id, registry_id → Registry, name, sort_order, is_default

Item
  id (UUID), registry_id → Registry, category_id → Category,
  added_by_user_id → User,
  url_original,
  source_site (enum: LAZADA_PH | SHOPEE_PH | AMAZON | GALAXUS | SM | ROBINSONS | MANUAL),
  title, description, image_url,
  price_reference, currency,
  price_captured_at,
  quantity_desired (default: 1),
  flag (enum: EXACT_ONLY | SIMILAR_OK | SIMILAR_CHEAPER),
  notes, sort_order, created_at, updated_at

ItemMarketplaceHit  -- Phase 2: cross-marketplace search results
  id, item_id → Item, site (enum), url, price, currency, found_at

Claim
  id (UUID), item_id → Item,
  claimer_user_id → User (nullable),
  claimer_name, claimer_email,
  quantity_claimed (default: 1),
  claim_token (unique; for anonymous un-claim via email link),
  claimed_at, released_at (nullable)
```

---

## 8. API Design (REST)

### Auth
```
POST   /api/auth/register
POST   /api/auth/verify-email
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/logout
GET    /api/auth/oauth2/{provider}          -- Phase 2
GET    /api/auth/oauth2/callback/{provider} -- Phase 2
```

### Registries
```
GET    /api/registries
POST   /api/registries
GET    /api/registries/{slug}
PATCH  /api/registries/{slug}
DELETE /api/registries/{slug}
POST   /api/registries/{slug}/invite
POST   /api/registries/{slug}/join
```

### Items
```
GET    /api/registries/{slug}/items
POST   /api/registries/{slug}/items
GET    /api/items/{id}
PATCH  /api/items/{id}
DELETE /api/items/{id}
POST   /api/scrape/preview   -- Phase 2: preview scraped data before saving
```

### Claims
```
POST   /api/items/{id}/claims
DELETE /api/claims/{token}   -- anonymous un-claim via email token
DELETE /api/claims/{id}      -- authenticated un-claim
```

### Categories
```
GET    /api/registries/{slug}/categories
POST   /api/registries/{slug}/categories
PATCH  /api/categories/{id}
DELETE /api/categories/{id}
PUT    /api/registries/{slug}/categories/order
```

---

## 9. Database & Test Strategy

**PostgreSQL everywhere** — no H2 (ADR-007).

### Local Development
PostgreSQL runs on the host via Podman. Distrobox shares the network namespace:
```bash
# On host (outside distrobox):
podman run -d --name storkly-pg -p 5432:5432 \
  -e POSTGRES_DB=storkly -e POSTGRES_USER=storkly -e POSTGRES_PASSWORD=storkly \
  postgres:16-alpine
```
Spring Boot in distrobox connects to `localhost:5432`.

### JOOQ Codegen
Uses **DDL-based codegen** — parses Flyway SQL files directly. No running database needed at build time.

### DataSeeder
A `DataSeeder` component runs on startup when `SEED_DATA=true` (env var). Inserts:
- 2 test users (owner + gifter)
- 1 sample registry with varied visibility
- 5+ items across 3 categories with all flag types and claim states
- Sample custom category

### Integration Tests
- **Testcontainers** (PostgreSQL) for integration tests
- Unit tests mock repositories — no database needed
- CI (GitHub Actions) runs full integration suite with PostgreSQL service container

### Test Coverage Requirements

Every feature delivered from Phase 1D onward must include tests. No feature is
considered complete without them.

**Backend:**
- **Unit tests** for every service class (mocked repository dependencies)
- **Integration tests** for every controller endpoint (Testcontainers + `RestTestClient`)
- Helpers with non-trivial logic get their own unit tests
- `DataSeeder` is for UI development, not a substitute for tests

**Frontend:**
- **Component tests** for every feature component (Vitest + React Testing Library)
- Test user-visible behaviour, not implementation details (query by role/label)
- No snapshot tests

100% coverage is not the goal. The standard is: every user-facing behaviour has at
least one test that would break if the behaviour regressed.

### Profiles

| Profile | Database | Email | CAPTCHA |
|---|---|---|---|
| `local` | PostgreSQL on host (:5432) | Mailpit or console | Turnstile test key |
| `test` | Testcontainers PostgreSQL | None | Disabled |
| `prod` | PostgreSQL (Docker Compose) | Brevo SMTP | Turnstile live key |

---

## 10. Deployment

### Domain

`stork.ly` is taken ($75–100/yr for .ly regardless).
`storkli.st` and `stork.st` are also taken.

**Recommended: `storkly.app`** — clean, modern, ~$14/yr at Cloudflare Registrar.

| Option | Cost/yr |
|---|---|
| `storkly.app` ✓ recommended | ~$14 |
| `storkly.dev` | ~$12 |
| `storkly.io` | ~$35 |
| `getstorkly.com` | ~$10 |

### Setup Steps (One-Time)
1. Buy domain at [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (at-cost pricing, DNS included)
2. Provision Hetzner CX22 (Ubuntu 24.04)
3. Add DNS `A` record: `storkly.app` → VPS IP
4. Clone repo, fill `.env`, run `docker compose up -d`
5. Caddy auto-provisions TLS via Let's Encrypt on first request
6. Register app in Google Cloud Console for OAuth redirect URIs (Phase 2)

### docker-compose.yml (production)
```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443", "443:443/udp"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - ./frontend/dist:/srv/frontend:ro

  api:
    build: ./backend
    env_file: .env
    depends_on: [db]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: storkly
      POSTGRES_USER: storkly
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes: [pg_data:/var/lib/postgresql/data]

volumes:
  caddy_data:
  pg_data:
```

### Caddyfile
```
storkly.app {
  handle /api/* {
    reverse_proxy api:8080
  }
  handle {
    root * /srv/frontend
    try_files {path} /index.html
    file_server
  }
}
```

### Local Override (docker-compose.override.yml)
```yaml
services:
  api:
    environment:
      SPRING_PROFILES_ACTIVE: local
  # Mailpit replaces Brevo
  mailpit:
    image: axllent/mailpit
    ports: ["8025:8025"]  # Web UI for caught emails
```

---

## 11. Cost Estimate

### One-Time
| Item | Cost |
|---|---|
| Domain (`storkly.app`, 1 year) | ~$14 |
| Google Cloud Console OAuth app registration | Free |
| Facebook Developer app registration | Free |
| **Total one-time** | **~$14** |

### Monthly (Hetzner CX22)
| Item | Cost |
|---|---|
| Hetzner CX22 (2 vCPU ARM, 4 GB RAM, 40 GB SSD) | €4.15/mo |
| Hetzner automated backups (+20%) | €0.83/mo |
| Let's Encrypt TLS | Free |
| Brevo email (300 emails/day free tier) | Free |
| Cloudflare DNS | Free |
| Cloudflare Turnstile CAPTCHA | Free |
| **Total monthly** | **~€5/mo** |

> **Phase 2 note:** Playwright (headless Chromium) runs in-process or as a sidecar. The CX22 handles it fine for occasional scraping. If it becomes sluggish, upgrade to CX32 (4 vCPU, 8 GB RAM) for €8.57/mo.

---

## 12. Phased Delivery (Granular)

### Phase 1 — Foundation

**1A: Project Scaffold**
- Gradle multi-module (Kotlin DSL): `util`, `domain`, `service`, `scraper`, `web`
- Spring Boot 4 + Java 26 (`--enable-preview`)
- Deps: Spring Web, Security, Mail, Flyway, PostgreSQL driver, JOOQ, Lombok, Testcontainers
- React + Vite + TypeScript project
- Monorepo layout: `backend/`, `frontend/`, `docs/`
- Git repository, `.gitignore` (no LICENSE — private repo, ADR-004)
- Spotless + Prettier pre-configured

**1B: Docker & Infrastructure**
- `docker-compose.yml` (Caddy + API + PostgreSQL)
- `docker-compose.override.yml` (Mailpit, Turnstile test key)
- `Caddyfile` for local (`localhost`) and prod (domain)
- `application.yml` profiles: `local` (host PG), `test` (Testcontainers), `prod`
- CORS configuration for React dev server → Spring Boot API

**1C: Database Schema & JOOQ**
- Flyway migration scripts for all tables (see Data Model)
- JOOQ DDL-based codegen from Flyway scripts (ADR-007)
- `DataSeeder` component (activated by `SEED_DATA=true` env var)

**1C2: OpenAPI Codegen Pipeline**
- springdoc-openapi generates spec from controllers
- openapi-typescript generates TS types from spec
- Typed fetch wrapper in `frontend/src/api/`

**1D: Auth — Email/Password**
- `User` entity + repository
- Registration endpoint with Cloudflare Turnstile verification
- Email verification flow (token → Spring Mail → Mailpit locally)
- Login → JWT (access + refresh tokens)
- Password reset flow

**1E: Auth — OAuth Scaffolding**
- Spring Authorization Server dependency added and configured
- `OAuthProvider` enum in `User` table (LOCAL | GOOGLE | FACEBOOK)
- OAuth callback controller stubbed, not wired to any provider
- Ready for Phase 2 provider wiring

**1F: Registry & Category APIs**
- Registry CRUD endpoints
- Invite link generation + acceptance
- Registry subscription model
- Co-ownership: add/remove co-owners (owner only); co-owners can add/edit items
- Category CRUD + reorder

**1G: Item API (Manual Entry)**
- Item CRUD (no scraping — URL stored as plain text)
- `source_site` defaults to `MANUAL`; schema includes all scraper columns for Phase 2
- Flag, quantity, sort order

**1H: Claiming API**
- Anonymous claim (name + email + claim token)
- Authenticated claim
- Un-claim (token email link + authenticated)
- Visibility rules (owner sees claimer; others see "claimed")

**1I: Frontend Foundation**
- Shadcn/UI + Tailwind setup
- Peachy theme + dark mode toggle
- Layout: header, nav, registry page shell
- React Router setup
- OpenAPI-generated TS client wired to API

**1J: Frontend — Auth Screens**
- Register, verify email, login, forgot/reset password pages

**1K: Frontend — Registry Screens**
- Dashboard (list own registries)
- Create / edit registry
- Registry view (public + private)
- Invite link share UI

**1L: Frontend — Item Screens**
- Add item (URL + manual fields form)
- Item card with flag badge, quantity, claim button
- Category grouping and reorder
- Claim dialog (anonymous + authenticated flows)

**1M: DataSeeder Verification**
- Confirm full UI traversal works with seeded data
- Document how to run: `SEED_DATA=true ./gradlew :web:bootRun`

**1N: Safe Deletion**
- Registry delete: confirmation popup requiring user to type registry name (GitHub-style)
- Item delete: block deletion of items that have active claims (backend returns 409 Conflict)

**1O: Contributor Dashboard**
- Dashboard shows subscribed registries alongside owned ones
- Unsubscribe button on subscribed registries

**1P: Unverified Account Cleanup**
- `@Scheduled` job deletes unverified users older than 24 hours
- Handle re-registration of the same email gracefully (upsert or delete-then-insert)

**1Q: Navigation UX**
- Logo links to dashboard when logged in, landing page when not
- Remove "Dashboard" link from header
- Add "Back to dashboard" breadcrumb/link on registry pages

**1R: Item Card Redesign**
- Horizontal layout: [image | text/description | buttons]
- Category-based placeholder images when no scraped image exists
- Remove red delete buttons from the registry item list

**1S: Item Edit UX**
- Move delete action into the edit form (no standalone delete button on list)
- Quantity reduced to 0 on unsaved item → grey "Discard" button replaces "Save Changes"
- Quantity reduced to 0 on saved item → red "Delete" button replaces "Save Changes"

**1T: Registry Edit UX**
- Move delete button to edit screen (top-right, greyscale, not red)
- Delete requires name-confirmation popup (GitHub-style)
- Add `HIDDEN` visibility option (owner + co-owners only)
- Back button at top of edit screen returns to registry without saving

**1U: Registry Subscribers**
- Show subscriber list on registry page (visible to owner)

---

### Phase 2 — Auth Providers + Scraping

**2A: Google OAuth**
- Register app in Google Cloud Console
- Wire Google provider in Spring Authorization Server
- Frontend OAuth button

**2B: Facebook OAuth**
- Register app in Facebook Developer Console
- Wire Facebook provider
- Frontend OAuth button

**2C: Scraper Infrastructure**
- `ScraperService` interface + `ScrapeResult` DTO
- Playwright dependency + Docker integration
- `JsoupScraper` base class

**2D: Lazada PH Scraper**
- Playwright-based scraper for `lazada.com.ph`
- Extract: title, image, price, description

**2E: Shopee PH Scraper**
- Playwright-based scraper for `shopee.ph`

**2F: Amazon Scraper**
- Jsoup + JSON-LD structured data

**2G: Galaxus Scraper**
- Jsoup + structured data

**2H: SM / Robinsons Scrapers**
- Best-effort Jsoup scrapers

**2I: Scrape Preview Endpoint**
- `POST /api/scrape/preview` — returns scraped data before item is saved
- Frontend shows preview card; user confirms or edits

**2J: Cross-Marketplace Search**
- On item save, search all supported sites by product title
- Store results in `ItemMarketplaceHit`
- Show lowest price + alternatives on item detail

**2K: Partial Quantity Claiming**
- Update claim model to support partial quantities
- UI update for claim dialog

---

### Phase 3 — Open Source Release

**3A: Documentation**
- `README.md`: project overview, setup, local dev guide
- `CONTRIBUTING.md`
- `CHANGELOG.md`
- Update this `ARCHITECTURE.md` to reflect final state

**3B: CI/CD**
- GitHub Actions: build + test on PR
- Docker image build and push to GHCR

**3C: One-Click Deploy**
- Hetzner setup shell script (`scripts/setup-hetzner.sh`)
- `.env.example` with all required variables

---

## 13. Git Workflow

- **Commit after each granular sub-task** (e.g. 1A, 1B, ...) — never batch unrelated changes
- **Commit message format:**

```
<PhaseId> - <Topic>: concise summary of what changed and why

<Implementation summary — what was built, key files, notable details.
This is the body of the commit message. Be thorough: list what was
created/modified, what choices were made, and any caveats.>

ADR-NNN: short decision summary (one per line, when applicable)

Co-Authored-By: ...
```

Examples:
```
1A - Scaffold: initialize Gradle multi-module project

Gradle multi-module (Kotlin DSL): util, domain, service, scraper, web.
Spring Boot 4.1.0-M4 + Java 26 (--enable-preview). Version catalog in
gradle/libs.versions.toml. Spotless with palantir-java-format 2.90.0.
React + Vite + TypeScript frontend scaffold.

ADR-001: Gradle Kotlin DSL over Maven
ADR-004: private repo, no license yet
ADR-007: PostgreSQL everywhere, no H2
```

```
1D - Auth: email/password registration with Argon2 + Turnstile CAPTCHA

AuthController with register/login/verify-email/forgot-password/reset-password
endpoints. Argon2PasswordEncoder for hashing. TurnstileClient (HTTP Service
Client) for server-side CAPTCHA verification. JWT access (15min) + refresh (7d)
tokens in httpOnly cookies. EmailVerificationService sends token via Spring Mail.

ADR-009: httpOnly cookies over localStorage for JWT storage
```

```
1C - DB: Flyway migration V1 — full schema with JOOQ DDL codegen

V1__initial_schema.sql: 9 tables, 5 enum types. JOOQ DDL-based codegen in
domain module — parses Flyway SQL at build time, no running DB needed.
DataSeeder component (STORKLY_SEED_DATA=true) inserts 2 users, 1 registry,
3 categories, 5 items, 1 claim. VARCHAR used instead of TEXT for UNIQUE
columns (H2 inside DDLDatabase can't index CLOBs; no runtime difference
on PostgreSQL).

ADR-003: JOOQ over Hibernate
ADR-007: DDL-based codegen, no running DB needed
```

- Keep `main` always in a working state; feature branches optional for larger sub-tasks

### Architecture Decision Records (ADRs)

**When you make an implementation choice that isn't directly specified in ARCHITECTURE.md,
create a new ADR.** Examples:
- Choosing a library version to resolve a compatibility issue
- Changing a column type to work around a tooling limitation
- Picking one valid approach over another when the spec is silent
- Deviating from the spec for a good reason

The ADR captures *why* so future readers don't have to guess. Create the file in
`docs/decisions/NNN-short-title.md`, add it to `docs/DECISIONS.md`, and reference
it in the commit message.

Do not skip this. If you made a choice, document it.

---

## 14. Resolved Decisions

| # | Decision |
|---|---|
| Q1 | Name: **Storkly**, domain: `storkly.app` |
| Q2 | Cross-marketplace search: synchronous backend call, async UX (spinner in frontend) |
| Q3 | Partial quantity claiming: Phase 1 (sub-task 1H) |
| Q4 | Not starting yet — distrobox environment check first |
| — | ORM: JOOQ OSS (free for PostgreSQL even commercially) + Flyway |
| — | Passwords: Argon2id via Spring Security (no custom crypto) |
| — | Co-ownership: `RegistryCoOwner` table; `added_by_user_id` on Item |
| — | Facebook OAuth: Phase 2 alongside Google OAuth |
| — | Java 26 + Spring Boot 4; Valhalla value classes in preview where applicable |
| — | TS formatting: Prettier (with prettier-plugin-tailwindcss) |
| ADR-007 | Drop H2; PostgreSQL everywhere; JOOQ DDL-based codegen |
| ADR-008 | Java records for DTOs; drop Lombok `@Value` |

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
| F-21 | Add item by pasting URL — auto-fill via OG tags + JSON-LD link preview | 2C |
| F-21a | Upload a custom item image (JPEG/PNG/WebP/GIF ≤5 MB) | 2C |
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

### 3.6 Supported Marketplaces

Phase 2C adds a **link preview** for any URL via OG tags + JSON-LD (no Playwright — ADR-012).
Full per-site deep scrapers are Phase 2D–2H and use Jsoup where possible.

| Site | Region | Phase 2C Link Preview | Phase 2D–2H Deep Scraper |
|---|---|---|---|
| Lazada PH | Philippines | OG tags | TBD (previously Playwright — dropped, ADR-012) |
| Shopee PH | Philippines | OG tags | TBD |
| Amazon | Global | OG tags + JSON-LD | Jsoup + JSON-LD |
| Galaxus | CH / DE / AT | OG tags + JSON-LD | Jsoup + JSON-LD |
| SM Superstores | Philippines | OG tags (best-effort) | Jsoup (best-effort) |
| Robinsons | Philippines | OG tags (best-effort) | Jsoup (best-effort) |

Unsupported URL (link preview returns `supported: false`) → user is informed and offered manual entry pre-filled with the URL.

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
| **Link Preview** | Jsoup + OG tags + JSON-LD + Caffeine | Phase 2C; HTTP fetch → meta-tags + structured data → form auto-fill |
| **Scraping** | Jsoup | Phase 2D–2H; full product scrapers; Playwright dropped in favour of OG approach (ADR-012) |
| **Image Upload** | Spring Multipart + local filesystem | Phase 2C; JPEG/PNG/WebP/GIF ≤5 MB; served as `/uploads/{uuid}.ext` |
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
  scraper/                  ← Link preview + item scrapers (Jsoup, OG tags + JSON-LD)
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
│       ▼         │  LinkPreviewService  │    │  uploads/ │  │
│  ┌─────────┐    │  ImageService        │───▶│  volume   │  │
│  │  React  │    │  Email (async)       │    │           │  │
│  │  SPA    │    └──────────────────────┘    └───────────┘  │
│  │ (static)│                                               │
│  └─────────┘    ┌──────────────────────┐                   │
│                 │ Mailpit (local dev)  │                   │
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
  email_verified_at, provider (LOCAL | GOOGLE | FACEBOOK),  -- see note below
  provider_id,                                               -- see note below
  role (USER | ADMIN), created_at

-- NOTE (deferred — see 2B2): provider + provider_id on User only store one
-- OAuth identity per account. The second social login silently overwrites the
-- first, breaking the original. The fix is to extract these into a join table:
--
-- UserOAuthProvider  (replaces provider + provider_id on User)
--   id, user_id → User, provider (GOOGLE | FACEBOOK), provider_id (unique per provider),
--   linked_at
--   UNIQUE (provider, provider_id)
--
-- User.provider becomes LOCAL-only flag (or is dropped in favour of
-- checking whether a password_hash exists).
-- Migration: copy existing rows into the new table, drop columns from User.

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
  item_type (enum: PRODUCT | FUND),
  notes, sort_order, created_at, updated_at

  -- The item_type Postgres enum still carries an unused 'EVENT' value (added in V17,
  -- cannot be dropped). Events attach to *claims* via a delivery option, not to items —
  -- see ADR-017 and the delivery_option.event_id column.

ItemMarketplaceHit  -- Phase 2: cross-marketplace search results
  id, item_id → Item, site (enum), url, price, currency, found_at

Claim
  id (UUID), item_id → Item,
  claimer_user_id → User (nullable),
  claimer_name, claimer_email,
  quantity_claimed (default: 1),
  claim_token (unique; for anonymous un-claim via email link),
  claimed_at, released_at (nullable)

Event
  id (UUID), owner_id → User,
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT (nullable),
  rsvp_token VARCHAR UNIQUE NOT NULL,  -- random token; forms the URL /rsvp/<rsvp_token>
  created_at TIMESTAMPTZ

  -- Events are standalone: they can exist without any registry link.
  -- The rsvp_token never changes after creation (no token rotation).

-- Events attach to claims, not items: a delivery_option (claim type) of type 'EVENT'
-- carries an event_id → Event ON DELETE CASCADE (V29). Picking that claim type means
-- "I'll hand the gift over at this event." See ADR-017. (The old event_registry_item
-- join table was dropped in V28.)

Rsvp
  id (UUID), event_id → Event ON DELETE CASCADE,
  user_id → User ON DELETE SET NULL (nullable — for anonymous RSVPs),
  email VARCHAR NOT NULL,
  display_name TEXT NOT NULL,
  attending BOOLEAN NOT NULL,
  confirmation_token VARCHAR UNIQUE NOT NULL,  -- per-RSVP email-confirm token
  confirmed_at TIMESTAMPTZ (nullable — null means unconfirmed),
  created_at TIMESTAMPTZ
  UNIQUE(event_id, email)  -- one RSVP per email per event; re-submission upserts

  -- Authenticated users: user_id is set; confirmed_at is set immediately (no email).
  -- Anonymous users: confirmation email sent; confirmed_at set on email-link click.
  -- Re-submitting (same email, same event) replaces the row and re-sends confirmation
  --   if previously unconfirmed, or updates the attending flag if already confirmed.
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
POST   /api/link-preview     -- Phase 2C: OG-tag link preview (any URL); auto-fills item form
POST   /api/images           -- Phase 2C: upload item image; returns /uploads/{uuid}.ext
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

### Events (Phase 1V)
```
GET    /api/events                       -- list caller's owned events (auth required)
POST   /api/events                       -- create event (auth required)
GET    /api/events/{id}                  -- owner detail: includes full attendees list (auth, owner only)
PATCH  /api/events/{id}                  -- update event (auth, owner only)
DELETE /api/events/{id}                  -- delete event (auth, owner only)
GET    /api/events/{id}/public           -- public event info: title, date, location only (permitAll)
```

### RSVP (Phase 1V)
```
GET    /api/rsvp/{rsvpToken}             -- event info for the RSVP form page (permitAll)
POST   /api/rsvp/{rsvpToken}             -- submit RSVP; Turnstile required (permitAll)
GET    /api/rsvp/confirm/{confirmToken}  -- confirm RSVP via email link; returns { eventId } (permitAll)
```

Note: Spring MVC resolves `/api/rsvp/confirm/{confirmToken}` before `/api/rsvp/{rsvpToken}`
because the literal path segment "confirm" matches more specifically than the variable.

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
- 1 sample Event with rsvp_token
- 2 sample RSVPs (1 attending + confirmed, 1 not attending + confirmed)
- 1 EVENT-type item in the sample registry linked to the sample event

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
storkly.cc {
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

### Phase 1V — Events & RSVP

> **Prerequisite knowledge for implementors:** read sections 7 (Data Model), 8 (API Design → Events + RSVP), and this section in full before starting any sub-task.

#### Overview

Events are first-class entities owned by a user (independent of registries). They appear on the dashboard alongside registries. The RSVP flow uses email confirmation (Turnstile-protected submission), with authenticated users auto-confirmed.

> **Superseded:** This section originally linked events to registry *items* of type `EVENT` via a join table, visible only to confirmed attendees. That approach was removed (V28). Events now attach to *claims* through an `EVENT` delivery option (claim type) — see ADR-017. The 1V-F and 1V-K notes below describe the removed item-level approach and are kept only for historical context.

#### URL structure

| Path | Visibility | Description |
|---|---|---|
| `/dashboard` | auth | My Dashboard — Registries + Events |
| `/event/new` | auth | Create event |
| `/e/:id/edit` | auth (owner only) | Edit event + attendees list + RSVP link |
| `/e/:id` | public | Public event page (title, date, location; no attendees) |
| `/rsvp/:token` | public | RSVP form (loaded via `rsvp_token` on the event) |
| `/rsvp/confirm` | public | RSVP confirmation callback (reads `?token=` query param) |

React Router: define `/rsvp/confirm` **before** `/rsvp/:token` to prevent "confirm" matching as a token.

#### Database migrations (V17–V20)

**V17** — `ALTER TYPE item_type ADD VALUE IF NOT EXISTS 'EVENT';` *(The `EVENT` enum value is now unused — events attach to claims, not items — but the value cannot be dropped from a Postgres enum, so it remains. See ADR-017.)*

The JOOQ codegen task is `:domain:jooqCodegen` (DDL-based, no database required).

**V18** — `event` table (see Data Model section 7).

**V19** — `rsvp` table (see Data Model section 7). Unique constraint on `(event_id, email)` — use `INSERT ... ON CONFLICT (event_id, email) DO UPDATE` (JOOQ `.onConflict(...).doUpdate()`) so re-submissions upsert cleanly.

**V20** — `event_registry_item` join table. *Dropped in V28; superseded by the `EVENT` claim type (V29 adds `delivery_option.event_id`). See ADR-017.*

#### Backend module layout

Follow the existing `util ← domain ← service ← web` dependency rule.

**`domain/event/`**
- `Event.java` — record + `@Builder`
- `EventRepository.java` — interface: `save`, `findByOwnerId`, `findById`, `deleteById`
- `Rsvp.java` — record + `@Builder`
- `RsvpRepository.java` — interface: `upsert` (by event_id + email), `findByEventId`, `findByConfirmToken`, `confirm(id, confirmedAt)`
- `EventRegistryItemRepository.java` — interface: `saveLink(eventId, itemId)`, `findEventIdsByItemId(itemId)`, `deleteByItemId(itemId)`

**`domain/exception/`**
- `EventNotFoundException.java` — extends `DomainException`

**`service/event/`**
- `EventService.java` — CRUD + `findPublic(id)` (returns limited view without attendees)
- `RsvpService.java`:
  - `submitRsvp(rsvpToken, displayName, email, attending, captchaToken, @Nullable userId)` — verifies Turnstile (skip if `userId != null`? No — still verify Turnstile for anonymous; authenticated users also go through Turnstile on the RSVP page), resolves event by `rsvp_token`, upserts RSVP row, sends confirmation email if anonymous, auto-confirms if `userId != null`
  - `confirmRsvp(confirmToken) → UUID eventId` — sets `confirmed_at`, returns the event's UUID for the frontend redirect

**`EmailService.java`** — add method:
```java
sendRsvpConfirmation(String to, String name, String eventTitle, String confirmToken)
// body: links to {frontendUrl}/rsvp/confirm?token={confirmToken}
// subject: "Confirm your RSVP for {eventTitle}"
```

**`web/event/`**
- `EventController.java`
- `dto/EventCreateRequest.java` — `@NotBlank String title`, `@NotNull OffsetDateTime eventDate`, `@Nullable String location`
- `dto/EventUpdateRequest.java` — all nullable fields
- `dto/EventResponse.java` — `id, title, eventDate, location, rsvpToken, List<RsvpResponse> attendees, createdAt`
- `dto/EventPublicResponse.java` — `id, title, eventDate, location` (no token, no attendees)
- `dto/RsvpResponse.java` — `id, displayName, email, attending, confirmedAt` (owner-only DTO embedded in EventResponse)

**`web/rsvp/`**
- `RsvpController.java`
- `dto/RsvpSubmitRequest.java` — `@NotBlank String displayName`, `@NotBlank String email` (ignored for authenticated users — filled from principal), `@NotNull Boolean attending`, `@NotBlank String captchaToken`
- `dto/RsvpPublicEventResponse.java` — `eventId, eventTitle, eventDate, location`
- `dto/RsvpConfirmResponse.java` — `String eventId`

**`web/infrastructure/`**
- `EventRepositoryImpl.java` — JOOQ impl
- `RsvpRepositoryImpl.java` — JOOQ impl; `upsert` uses `dsl.insertInto(RSVP)...onConflict(RSVP.EVENT_ID, RSVP.EMAIL).doUpdate()...`
- `EventRegistryItemRepositoryImpl.java` — JOOQ impl

**`SecurityConfig.java`** — add permitAll matchers:
```java
.requestMatchers(HttpMethod.GET,  "/api/events/{id}/public").permitAll()
.requestMatchers(HttpMethod.GET,  "/api/rsvp/{rsvpToken}").permitAll()
.requestMatchers(HttpMethod.POST, "/api/rsvp/{rsvpToken}").permitAll()
.requestMatchers(HttpMethod.GET,  "/api/rsvp/confirm/{confirmToken}").permitAll()
```

#### Changes to existing backend classes

**`ItemType.java`** (domain enum) — add `EVENT`

**`ItemService.java`**:
- `create(...)` — add `@Nullable UUID eventId` param. After saving, if `itemType == EVENT && eventId != null`: verify `eventRepository.findById(eventId)` exists and `event.ownerId().equals(addedByUserId)`, then call `eventRegistryItemRepository.deleteByItemId(item.id())` + `saveLink(eventId, item.id())`.
- `update(...)` — add `@Nullable UUID eventId` param; same logic as create; if `eventId == null` and `itemType` is being changed away from EVENT, call `deleteByItemId`.
- `findByRegistry(slug, currentUserId)` — after fetching all items for the registry, filter EVENT items: for authenticated users, keep EVENT item only if `eventRegistryItemRepository.findEventIdsByItemId(item.id())` has at least one event where the user has a confirmed RSVP; for unauthenticated users, remove all EVENT items. Implement with a single set-based check: `rsvpRepository.findConfirmedEventIdsByUserEmail(email)` or `findConfirmedEventIdsByUserId(userId)` to avoid N+1 queries.
- `validateItemTypeConstraints(ItemType, boolean alreadyOwned)` — also disallow `alreadyOwned=true` for EVENT items.

**`ClaimService.java`** — in `claim()`, add guard after loading the item:
```java
if (item.itemType() == ItemType.EVENT) {
    throw new AccessDeniedException("Event items cannot be claimed directly");
}
```

**`ItemCreateRequest.java`** — add `@Nullable UUID eventId` field (used only when `itemType=EVENT`)

**`ItemUpdateRequest.java`** — add `@Nullable UUID eventId` field

**`ItemResponse.java`** — add `List<UUID> linkedEventIds` field

**`ItemController.java`** — pass `request.eventId()` through to both service calls

**`ItemRepositoryImpl.java`** — no change; the event join is managed by `EventRegistryItemRepositoryImpl`

**Note on N+1 for `linkedEventIds` in item responses:** `ItemController.listByRegistry` must populate `linkedEventIds` on each item. Do this in the service: after `itemRepository.findByRegistryId(registry.id())`, call `eventRegistryItemRepository.findAllByRegistryId(registry.id())` (new method returning `Map<UUID itemId, List<UUID> eventIds>`) in one query, then attach. Do not make per-item calls.

#### Frontend

**`schema.ts`** changes:
```typescript
// Update existing:
export type ItemType = "PRODUCT" | "FUND" | "EVENT";

// Update item request bodies to include:
// POST /api/registries/{slug}/items — add: itemType?: ItemType; eventId?: string | null
// PATCH /api/items/{id}            — add: itemType?: ItemType | null; eventId?: string | null
// Note: itemType was always in the backend DTOs but was missing from schema.ts

// Update ItemResponse — add:
linkedEventIds: string[];

// New interfaces:
export interface EventResponse {
  id: string;
  title: string;
  eventDate: string;        // ISO-8601 with timezone
  location: string | null;
  rsvpToken: string;
  attendees: RsvpResponse[];
  createdAt: string;
}

export interface EventPublicResponse {
  id: string;
  title: string;
  eventDate: string;
  location: string | null;
}

export interface RsvpResponse {
  id: string;
  displayName: string;
  email: string;
  attending: boolean;
  confirmedAt: string | null;
}

export interface RsvpPublicEventResponse {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  location: string | null;
}

export interface RsvpConfirmResponse {
  eventId: string;
}

// New paths to add to the `paths` type:
// /api/events, /api/events/{id}, /api/events/{id}/public,
// /api/rsvp/{rsvpToken}, /api/rsvp/confirm/{confirmToken}
```

**`hooks/useEvents.ts`** — TanStack Query hooks:
- `useMyEvents()` — GET /api/events
- `useEvent(id)` — GET /api/events/{id} (owner; includes attendees)
- `usePublicEvent(id)` — GET /api/events/{id}/public
- `useCreateEvent` — mutation POST /api/events; invalidates `useMyEvents`
- `useUpdateEvent(id)` — mutation PATCH /api/events/{id}; invalidates event + list
- `useDeleteEvent(id)` — mutation DELETE; invalidates list

**`hooks/useRsvp.ts`**:
- `useRsvpEventInfo(rsvpToken)` — GET /api/rsvp/{rsvpToken}
- `useSubmitRsvp(rsvpToken)` — mutation POST /api/rsvp/{rsvpToken}
- `useConfirmRsvp` — mutation GET /api/rsvp/confirm/{confirmToken} (called on page mount)

**`components/event/EventCard.tsx`** — dashboard card: title, formatted date, location (if set), attendee count badge. Links to `/e/:id/edit` for owner.

**`components/event/EventForm.tsx`** — controlled form using React Hook Form + Zod: title (text input), eventDate (datetime-local input — use `z.string()` and parse to ISO; follow existing `z.string().refine()` pattern from the codebase for date fields), location (optional text). On submit calls `onSubmit(data)` prop.

**`components/event/EventAttendeesTable.tsx`** — table showing `displayName`, `email`, attending badge (Yes/No), confirmed badge. Displayed only on `/e/:id/edit` (owner).

**`components/rsvp/RsvpForm.tsx`** — Yes/No toggle buttons, `displayName` + `email` fields (hidden and pre-filled from auth context when user is authenticated), Turnstile widget (reuse existing Turnstile component pattern from RegisterPage), submit button. Shows "Check your email to confirm your RSVP" success state after submit.

**`pages/event/CreateEventPage.tsx`** — renders `EventForm`; on success redirects to `/e/:id/edit`.

**`pages/event/EditEventPage.tsx`** — loads `useEvent(id)`; renders `EventForm` (pre-filled) + RSVP link copy button (copies `{baseUrl}/rsvp/{rsvpToken}` to clipboard) + `EventAttendeesTable`. Shows 403 for non-owners.

**`pages/PublicEventPage.tsx`** — loads `usePublicEvent(id)`; shows title, formatted date/time, location. Does not show attendees. This page is the destination after RSVP confirmation.

**`pages/RsvpPage.tsx`** — loads `useRsvpEventInfo(rsvpToken)`; renders event details + `RsvpForm`. After form submit, shows confirmation message ("Check your email…") and link to create account in a new tab (`/register`).

**`pages/RsvpConfirmPage.tsx`** — on mount reads `?token=` from query string, calls `useConfirmRsvp` mutation, on success redirects to `/e/:id` using the returned `eventId`. Shows loading spinner while in flight, error state if token invalid/expired.

**`pages/DashboardPage.tsx`** changes:
- Rename top-level `<h1>My registries</h1>` → `<h1>My Dashboard</h1>`
- Add `<h2>Registries</h2>` section header above the owned registries block
- Add `<Button asChild><Link to="/event/new">New event</Link></Button>` next to "New registry" button
- Add `<h2>Events</h2>` section below registries, rendering `<EventCard>` for each event from `useMyEvents()`

**`components/registry/ItemForm.tsx`** changes:
- Add `"EVENT"` to the item type selector (alongside PRODUCT and FUND)
- When `watch("itemType") === "EVENT"`: replace the title text input with a `<Select>` dropdown populated from `useMyEvents()`; each option shows event title; selecting an option sets both `title` (to the event title) and `eventId` hidden field
- On type change away from EVENT, clear `eventId`

**`components/registry/ItemCard.tsx`** changes:
- Add `"Event"` badge (alongside existing `"Fund"` badge) when `item.itemType === "EVENT"`

**`router.tsx`** — add 5 new routes. CRITICAL ordering:
```tsx
{ path: "rsvp/confirm", element: <RsvpConfirmPage /> },  // BEFORE rsvp/:token
{ path: "rsvp/:token",  element: <RsvpPage /> },
{ path: "e/:id",        element: <PublicEventPage /> },
{
  element: <RequireAuth><Outlet /></RequireAuth>,
  children: [
    // existing children...
    { path: "event/new",  element: <CreateEventPage /> },
    { path: "e/:id/edit", element: <EditEventPage /> },
  ]
}
```

#### Sub-task sequence (11 commits)

| Sub-task | What | Commit label |
|---|---|---|
| **1V-A** | V17–V20 migrations + JOOQ regen | `1V-A - DB: events, rsvp, event_registry_item schema` |
| **1V-B** | Domain + service: Event CRUD; unit tests | `1V-B - Event: domain, EventRepository, EventService` |
| **1V-C** | Web: EventController + DTOs + security; integration tests | `1V-C - Event: REST API, DTOs, security allowlist` |
| **1V-D** | Domain + service: Rsvp + email; unit tests | `1V-D - RSVP: domain, RsvpRepository, RsvpService, email` |
| **1V-E** | Web: RsvpController + DTOs; integration tests | `1V-E - RSVP: REST API` |
| **1V-F** | Item: EVENT type + event linkage + visibility + schema.ts gaps; tests | `1V-F - Item: EVENT type, event linking, visibility filter` |
| **1V-G** | Frontend: schema.ts, hooks (useEvents, useRsvp) | `1V-G - Frontend: schema types, event and rsvp hooks` |
| **1V-H** | Frontend: Dashboard + EventCard; tests | `1V-H - Frontend: My Dashboard with Events section` |
| **1V-I** | Frontend: EventForm, CreateEventPage, EditEventPage, PublicEventPage; tests | `1V-I - Frontend: event create/edit/public pages` |
| **1V-J** | Frontend: RsvpForm, RsvpPage, RsvpConfirmPage; tests | `1V-J - Frontend: RSVP form and confirmation pages` |
| **1V-K** | Frontend: ItemForm EVENT mode + ItemCard badge + router; tests | `1V-K - Frontend: EVENT item form and routing` |
| **1V-L** | DataSeeder update + e2e smoke test notes | `1V-L - DataSeeder: sample event and RSVPs` |

Each sub-task must follow the existing commit format from section 13. Backend sub-tasks: run `./gradlew spotlessApply` before committing. Frontend sub-tasks: run `npx prettier --write src/` and `npm test` before committing.

#### Edge cases to handle

- **Duplicate RSVP submission** (same email, different `attending` value): upsert replaces the row. If `confirmed_at` was already set, keep it (user is just updating their response); if `confirmed_at` was null, reset the confirmation token and re-send email.
- **EVENT item with deleted event**: if the linked event is deleted, `event_registry_item` rows cascade. The item remains but `linkedEventIds` is empty. `findByRegistry` will exclude it for all users (no linked event = no RSVP to check against). The registry owner will still see it when editing (owner write access bypasses the RSVP filter — actually confirm this is the right UX: owner should probably see EVENT items regardless of RSVP status so they can manage them).
- **Registry owner sees all items**: `ItemService.findByRegistry` should skip the EVENT visibility filter for the registry owner and co-owners — they need to see and manage EVENT items even if not RSVP'd.
- **`itemType` missing from schema.ts POST/PATCH bodies** (pre-existing gap): fix in 1V-F alongside the EVENT changes so the body is consistent for all item types.
- **Turnstile on authenticated RSVP**: keep Turnstile on the RSVP form even for authenticated users — it protects against bot-spamming event RSVPs.

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

**2B2: Multi-Provider OAuth (deferred)**
- Replace `provider` + `provider_id` columns on `User` with a `UserOAuthProvider` join table
- Flyway migration: copy existing rows, add table, drop columns
- Update `OAuthService.findOrCreate` to insert/lookup via the join table
- A user can then have both Google and Facebook linked simultaneously
- `User.provider` becomes redundant; distinguish LOCAL vs OAuth by presence of `password_hash`

**2C: Link Preview / Item Import (ADR-012)**
- `POST /api/link-preview` — Jsoup HTTP fetch (`facebookexternalhit/1.1` UA) → OG meta tags + JSON-LD → returns `{url, title, description, imageUrl, priceReference, currency, sourceSite, supported}`
- Response cached with Caffeine (500 entries, 1h TTL)
- Frontend: URL field `onBlur` → call link-preview → auto-fill empty fields; banner "Fields auto-filled from URL"
- `POST /api/images` — multipart upload; validates MIME type + size (≤5 MB); saves as `{IMAGES_DIR}/{UUID}.ext`; returns `/uploads/{uuid}.ext`
- `ImageSource` segmented pill on item form: **None / From URL / Upload**
- Vite dev server proxies `/uploads/**` → backend; Caddy proxies `/uploads/**` → API in production

**2D: Lazada PH Deep Scraper**
- Jsoup-based scraper for `lazada.com.ph` (OG tags sufficient for preview; deep scraper for full data)

**2E: Shopee PH Deep Scraper**
- Jsoup-based scraper for `shopee.ph`

**2F: Amazon Deep Scraper**
- Jsoup + JSON-LD structured data

**2G: Galaxus Deep Scraper**
- Jsoup + structured data

**2H: SM / Robinsons Scrapers**
- Best-effort Jsoup scrapers

**2I: Cross-Marketplace Price Comparison**
- On item save, search supported sites by product title
- Store results in `ItemMarketplaceHit`; show alternatives on item detail

**2J: Partial Quantity Claiming**
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

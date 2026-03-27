# ADR 007 — Drop H2, PostgreSQL Everywhere

**Status:** Accepted
**Date:** 2026-03-27

## Context

The architecture initially planned H2 in-memory for local dev and tests, with PostgreSQL in prod. During review, H2/PostgreSQL dialect differences were identified as a source of bugs: `UUID` types, `TIMESTAMP WITH TIME ZONE`, `TEXT` vs `VARCHAR`, enum handling, and JSON columns all differ. H2's "PostgreSQL compatibility mode" doesn't cover everything.

## Decision

**Drop H2 entirely.** Use PostgreSQL for all profiles.

## Approach

### Local dev (distrobox)
PostgreSQL runs on the host via Podman. Distrobox shares the host network namespace, so Spring Boot in the distrobox connects to `localhost:5432`.

```bash
# On the host (outside distrobox):
podman run -d --name storkly-pg -p 5432:5432 \
  -e POSTGRES_DB=storkly -e POSTGRES_USER=storkly -e POSTGRES_PASSWORD=storkly \
  postgres:16-alpine
```

### JOOQ codegen
Uses **DDL-based codegen** — JOOQ parses the Flyway SQL files directly, no running database needed at build time:

```kotlin
// build.gradle.kts
jooq {
    configurations {
        create("main") {
            generator {
                database {
                    name = "org.jooq.meta.extensions.ddl.DDLDatabase"
                    properties {
                        property { key = "scripts"; value = "src/main/resources/db/migration/*.sql" }
                        property { key = "sort"; value = "flyway" }
                    }
                }
            }
        }
    }
}
```

### Integration tests
- **Testcontainers** (PostgreSQL) for CI and when Docker/Podman is available
- Unit tests mock repositories and need no database
- CI (GitHub Actions) uses a PostgreSQL service container

### DataSeeder
A `DataSeeder` component loads sample data on startup when `SEED_DATA=true` (env var, not profile-based). Works with any PostgreSQL instance.

## Profiles

| Profile | Database | Email | CAPTCHA |
|---|---|---|---|
| `local` | PostgreSQL on host (:5432) | Mailpit or console | Turnstile test key |
| `test` | Testcontainers PostgreSQL | None | Disabled |
| `prod` | PostgreSQL (Docker Compose) | Brevo SMTP | Turnstile live key |

## Consequences

- No H2 dependency; one fewer dialect to worry about
- Flyway scripts can use PostgreSQL-specific features freely (UUID, JSONB, TEXT, etc.)
- Developers must run PostgreSQL locally (trivial with Podman one-liner)
- JOOQ DDL-based codegen avoids chicken-and-egg problem — no running DB needed for builds
- Integration tests need Testcontainers (Docker/Podman access); run in CI if unavailable locally

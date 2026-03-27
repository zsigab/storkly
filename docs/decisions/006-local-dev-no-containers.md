# ADR 006 — Local Dev Runs Spring Boot Directly (No Containers)

**Status:** Accepted
**Date:** 2026-03-27

## Context

Owner's local environment is a Linux distrobox. Podman (the container runtime on the host) is not accessible from inside the distrobox. Docker/Colima is reserved for the pre-production environment.

## Decision

**Local development** runs `./gradlew :web:bootRun` directly inside the distrobox.
Spring Boot's `local` profile connects to PostgreSQL on the host (via Podman) and uses Mailpit or console logging for email.

**Pre-production** (Colima on Mac or Linux VM) uses the full Docker Compose stack.

## Profiles

| Profile | Database | Email | Auth |
|---|---|---|---|
| `local` | PostgreSQL on host via Podman (:5432) | Mailpit or console | Turnstile test key |
| `test` | Testcontainers PostgreSQL | None | Disabled |
| `prod` (Hetzner) | PostgreSQL (Docker Compose) | Brevo SMTP | Turnstile live key |

> H2 was dropped entirely — see ADR-007.

## Consequences

- Local dev requires PostgreSQL on the host (one Podman command — see ADR-007)
- Java 26 + `./gradlew :web:bootRun` starts the backend
- OAuth2 (Phase 2) requires HTTPS and a real domain; not testable on `local` profile without extra tooling (mitmproxy or ngrok)
- Flyway scripts can use PostgreSQL-specific features freely (UUID, JSONB, TEXT, etc.)

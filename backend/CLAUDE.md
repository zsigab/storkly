# Storkly Backend — Agent Instructions

Spring Boot 4 / Java 26, multi-module Gradle (Kotlin DSL).

> Spring Boot **4.1.0-M4** (milestone, `repo.spring.io/milestone`) + Java **26** (`--enable-preview`).
> Valhalla value classes use `--enable-preview` — mark usages with `// Valhalla: value class`.

---

## CRITICAL — Do NOT

- **No Spring Data JPA / Hibernate.** No `@Entity`, `@OneToMany`, etc. JOOQ only (ADR-003).
- **No H2.** All profiles use PostgreSQL (ADR-007).
- **No Lombok `@Value` or `@Data`.** DTOs are Java records (ADR-008). Lombok: `@RequiredArgsConstructor`, `@Slf4j`, `@Builder` only.
- **No hardcoded secrets.** Use env vars. Provide `.env.example`, never `.env`.
- **No `com.fasterxml.jackson.databind.*` or `.core.*`.** Spring Boot 4 ships Jackson 3 — use `tools.jackson.*`. Exception: `com.fasterxml.jackson.annotation.*` annotations are unchanged.
- **No `RestTemplate` or raw `WebClient`.** Use declarative HTTP Service Client interfaces (`@GetExchange` / `@PostExchange`).
- **No `ExecutorService` + `Future`.** Use `StructuredTaskScope` (Java 26 preview).
- **No `TestRestTemplate` in new tests.** Use `RestTestClient` (Spring Boot 4).
- **No `SecurityFilterChain` that permits all.** Public endpoints are explicitly allowlisted; everything else requires auth.
- **No `var`** unless the type is long and immediately obvious from the RHS.

---

## Stack

- **Java 26** + `--enable-preview` (Valhalla value classes, StructuredTaskScope)
- **Spring Boot 4** (Spring Framework 7, Jakarta EE 11)
- **Spring Security** — JWT (Argon2id passwords), OAuth2 scaffolded for Phase 2
- **JOOQ OSS** — typesafe SQL DSL, DDL-based codegen from Flyway scripts
- **Flyway** — sole owner of DB schema (`web/src/main/resources/db/migration/`)
- **Lombok** — `@RequiredArgsConstructor`, `@Slf4j`, `@Builder` only
- **Jackson 3** — `tools.jackson.*` for databind/core
- **Testcontainers** (PostgreSQL) — integration tests
- **Spotless** (Palantir Java Format) — run `./gradlew spotlessApply` before committing

---

## Module Structure

```
backend/
  util/       ← pure Java, no Spring (SlugUtil, TokenUtil, MoneyUtil)
  domain/     ← entities, repository interfaces, enums, exceptions
    registry/ item/ user/ category/ exception/
  service/    ← application services + @Component helpers
    registry/ item/ auth/ email/ category/ user/
  scraper/    ← Phase 2 only (Playwright + Jsoup scrapers)
  web/        ← Spring Boot main, controllers, DTOs, config, infrastructure
    {domain}/
      {Domain}Controller.java
      dto/    ← Java records
    config/   ← SecurityConfig, JooqConfig, CorsConfig, OpenApiConfig
    exception/GlobalExceptionHandler.java
    infrastructure/ ← repository implementations (JOOQ)
    resources/db/migration/ ← Flyway scripts
```

Dependency rule: `util ← domain ← service ← web`. Nothing lower imports from higher.
`scraper` depends on `domain + util`, wired into `web`.

---

## Error Handling

One `@RestControllerAdvice` in `GlobalExceptionHandler`. Services throw typed domain exceptions; handler maps to RFC 7807 `ProblemDetail`.

| Exception type | HTTP status |
|---|---|
| `*NotFoundException` | 404 |
| `AccessDeniedException` | 403 |
| Conflict exceptions | 409 |
| `MethodArgumentNotValidException` | 422 |
| `AuthenticationException` | 401 |
| Unexpected `Exception` | 500 |

---

## Tests

Every feature from Phase 1D onward requires tests. No exceptions.

| Layer | Type | Tool |
|---|---|---|
| Service | Unit | JUnit 5 + Mockito (mock repos) |
| Controller | Integration | `RestTestClient` + Testcontainers |
| Repository | Integration | Testcontainers |

- No tests for getters/setters, Spring wiring, JOOQ-generated code, or DataSeeder.
- Testcontainers requires Docker/Podman. If unavailable locally, run in CI only.

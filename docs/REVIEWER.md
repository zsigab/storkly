# Storkly — Reviewer Agent Instructions

Use this document when reviewing code for the Storkly project.
Apply it after completing a phase or before merging significant changes.

---

## Review Scope

Check every changed file against these sources of truth, in priority order:

1. **`docs/ARCHITECTURE.md`** — system design, data model, API contracts, phasing
2. **`backend/AGENTS.md`** — Java/Spring coding conventions, anti-patterns, module rules
3. **`frontend/AGENTS.md`** — React/TS conventions, anti-patterns, component rules
4. **`docs/decisions/`** — ADRs; deviations from an ADR need justification

If the implementation improves on the spec (simpler, safer, more idiomatic), that is
acceptable — note it as a deliberate improvement, not a violation. The goal is to catch
**unintentional drift**, not to enforce the spec rigidly.

---

## What to Check

### Architecture Alignment

- Does the data model match ARCHITECTURE.md section 7?
- Do API endpoints match section 8 (paths, methods, request/response shapes)?
- Is the module dependency graph respected (`util ← domain ← service ← web`)?
- Are Phase 2+ features absent from Phase 1 code?
- Are enum values, table columns, and FK constraints consistent with the spec?

### Coding Conventions

**Backend (AGENTS.md):**

- No JPA/Hibernate annotations — JOOQ only
- No H2 — PostgreSQL everywhere
- No Lombok `@Value` or `@Data` — records for DTOs
- No `var` unless type is long and obvious from RHS
- Braces always present; `else`/`catch`/`finally` on new line
- `@RequiredArgsConstructor` for injection, no manual constructors
- Services orchestrate, Helpers map, Controllers are thin
- Version catalog used for all dependency versions (no hardcoded versions)
- Domain exceptions mapped via `GlobalExceptionHandler` to RFC 7807 `ProblemDetail`

**Frontend (AGENTS.md):**

- No `any` — use `unknown` and narrow
- No non-null assertions (`!`)
- No `default export` — named exports only
- No direct `fetch` in components — all through `src/api/` via TanStack Query
- No hardcoded colour values — Tailwind semantic tokens only
- No edits to `src/components/ui/` (Shadcn generated)
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`

### Security

- No secrets in committed files (`.env`, API keys, real passwords)
- JWT tokens in httpOnly cookies, not localStorage
- CAPTCHA verification server-side
- `SecurityFilterChain` never permits all — public paths are explicitly allowlisted
- Argon2id for password hashing (Spring Security's encoder, no custom crypto)
- CORS restricted to known origins per profile

### Test Coverage

- Every new feature (from Phase 1D onward) must include tests
- Backend: unit tests (mocked repos) + integration tests (Testcontainers + RestTestClient)
- Frontend: component tests (Vitest + React Testing Library)
- Tests must actually assert something — no empty `contextLoads()` stubs
- DataSeeder is not a substitute for tests

### Infrastructure

- Docker Compose: health checks, non-root user in Dockerfile, no secrets in image
- Flyway scripts: PostgreSQL-specific features OK, no H2 fallback
- JOOQ codegen: DDL-based, version matches between plugin and library
- Spring profiles: `local`, `test`, `prod` — no hardcoded profile defaults in base YAML
- Environment variables: documented in `.env.example`, never committed in `.env`

---

## Severity Classification

| Severity | Criteria |
|----------|----------|
| **CRITICAL** | Will break at runtime, security vulnerability, data loss risk, or fundamentally wrong design |
| **MAJOR** | Significant deviation from spec/conventions, should be fixed before next phase |
| **MINOR** | Style nit, small deviation, documentation mismatch, nice-to-fix |

---

## Output Format

Write review findings to `docs/review/YYYY-MM-DD-<scope>.md`.

For each finding:

```
### N. Short title

**Files:** `path/to/file.java:line`

What is wrong and why it matters.

**Fix:** Concrete action to resolve it.

**Spec:** Which document/section is violated.
```

End with a summary table:

```
| # | Severity | File(s) | Issue |
|---|----------|---------|-------|
```

---

## When to Review

- After completing each phase (1A, 1B, 1C, ...) before moving to the next
- Before any commit that touches security config, auth, or database schema
- When switching between AI-assisted and manual coding
- On request (`/review`)

# Architecture Decision Records — Storkly

Each decision lives in its own file in `docs/decisions/`.
This index provides a quick summary and links.

| # | Title | Status | Date |
|---|---|---|---|
| [001](decisions/001-gradle-over-maven.md) | Gradle (Kotlin DSL) over Maven | Accepted | 2026-03-27 |
| [002](decisions/002-spring-boot-over-quarkus.md) | Spring Boot 4 over Quarkus | Accepted | 2026-03-27 |
| [003](decisions/003-jooq-over-hibernate.md) | JOOQ over Hibernate/Spring Data JPA | Accepted | 2026-03-27 |
| [004](decisions/004-private-repo-no-license.md) | Private repo, no license until open-source | Accepted | 2026-03-27 |
| [005](decisions/005-null-safety-approach.md) | @NullMarked + stdlib over Apache Commons | Accepted | 2026-03-27 |
| [006](decisions/006-local-dev-no-containers.md) | Local dev runs Spring Boot directly, not in container | Accepted | 2026-03-27 |
| [007](decisions/007-drop-h2-postgresql-everywhere.md) | Drop H2, PostgreSQL everywhere, DDL-based JOOQ codegen | Accepted | 2026-03-27 |
| [008](decisions/008-records-over-lombok-value.md) | Java records for DTOs, drop Lombok @Value | Accepted | 2026-03-27 |
| [009](decisions/009-jwt-httponly-cookies.md) | JWT stored in httpOnly cookies, not localStorage | Accepted | 2026-03-28 |
| [010](decisions/010-oauth-cookie-state.md) | Cookie-based OAuth2 authorization request state (no server session) | Accepted | 2026-05-01 |
| [011](decisions/011-scraper-strategy-pattern.md) | Scraper interface design — strategy pattern with Spring bean list | Accepted | 2026-05-02 |
| [012](decisions/012-drop-playwright-og-link-preview.md) | Drop Playwright — OG tags + JSON-LD for link preview | Accepted | 2026-05-03 |
| [013](decisions/013-multi-dimension-theming.md) | Multi-dimension theming: color accent × style × mode | Accepted | 2026-05-09 |

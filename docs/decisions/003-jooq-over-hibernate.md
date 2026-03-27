# ADR 003 — JOOQ over Hibernate / Spring Data JPA

**Status:** Accepted
**Date:** 2026-03-27

## Context

Owner is not a fan of Hibernate's leaky abstractions and N+1 surprises. Options evaluated: Spring Data JPA (Hibernate), Spring Data JDBC, JOOQ OSS, MyBatis.

## Decision

Use **JOOQ OSS** for database access, with **Flyway** owning the schema.

## Reasons

- Typesafe SQL DSL: query errors caught at compile time, not runtime
- No entity manager, no first/second-level cache surprises
- SQL is explicit — what you write is what gets executed
- Flyway generates the JOOQ DSL classes from the actual migration scripts; schema and queries are always in sync
- **License:** JOOQ OSS is free for PostgreSQL, forever, even if the project becomes commercial. Paid license only required for Oracle/SQL Server/DB2.

## Consequences

- No `@Entity` / `@OneToMany` etc.; JOOQ records replace JPA entities
- Slightly more verbose for simple CRUD vs. Spring Data repositories (acceptable trade-off)
- JOOQ codegen runs as part of Gradle build; generated sources go in `build/generated-sources/jooq/`
- Flyway migrations must be applied before JOOQ codegen can run (handled in Gradle task ordering)

# ADR 001 — Gradle (Kotlin DSL) over Maven

**Status:** Accepted
**Date:** 2026-03-27

## Context

The project uses a multi-module build. Both Maven and Gradle support this, but the experience differs significantly at scale.

## Decision

Use **Gradle with Kotlin DSL** (`build.gradle.kts`).

## Reasons

- Multi-module configuration in Gradle is dramatically less verbose than Maven's parent POM inheritance
- Kotlin DSL gives IDE autocompletion and type-safety in build scripts
- Faster incremental builds via Gradle's task graph and build cache
- Owner is familiar with Maven (Watchlistarr) — learning Gradle is an explicit goal

## Consequences

- Learning curve for Gradle idioms (tasks, conventions, version catalogs)
- `./gradlew` instead of `mvn`; commands: `./gradlew :web:bootRun`, `./gradlew check`, `./gradlew spotlessApply`
- Version catalog (`gradle/libs.versions.toml`) centralises all dependency versions

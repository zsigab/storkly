# ADR 005 — Null Safety: @NullMarked + Java Stdlib over Apache Commons

**Status:** Accepted
**Date:** 2026-03-27

## Context

Owner requested Apache Commons CollectionUtils/StringUtils for null-safe checks, a pattern common in Java 11 enterprise codebases. Java 26 + Spring Boot 4 (Spring Framework 7) offer better-integrated alternatives.

## Decision

Use **JSpecify `@NullMarked`** on all packages as the primary null-safety strategy. Use Java stdlib for most checks. Include **Apache Commons Collections** only where it adds genuine value beyond stdlib.

## Approach

### Annotate packages with @NullMarked
```java
// package-info.java in every package
@NullMarked
package app.storkly.domain.registry;

import org.jspecify.annotations.NullMarked;
```

Spring Framework 7 is annotated with JSpecify. With `@NullMarked`, tools (IntelliJ, NullAway) flag null-unsafe usage at compile/lint time, making runtime null checks largely unnecessary in internal code.

### Java stdlib (use these by default)
```java
// String blank check
if (name == null || name.isBlank()) { ... }          // Java 11+
String safe = Objects.requireNonNullElse(name, "");  // Java 9+
Optional.ofNullable(value).orElse(defaultVal);

// Collection empty check
if (items == null || items.isEmpty()) { ... }
List<Item> safe = Objects.requireNonNullElse(items, List.of());
```

### Apache Commons Collections (use for these cases)
```java
// Null-safe isEmpty on a collection you don't control (external API, etc.)
CollectionUtils.isEmpty(externalList);   // handles null gracefully

// Set operations
CollectionUtils.intersection(a, b);
CollectionUtils.subtract(a, b);
```

### Do NOT use Apache Commons StringUtils for
```java
// These are fully covered by Java stdlib now:
StringUtils.isBlank(s)       → s == null || s.isBlank()
StringUtils.isEmpty(s)       → s == null || s.isEmpty()
StringUtils.isNotBlank(s)    → s != null && !s.isBlank()
StringUtils.capitalize(s)    → Character.toUpperCase(s.charAt(0)) + s.substring(1)
```

## Consequences

- `@NullMarked` requires adding `org.jspecify:jspecify` as a dependency (tiny, ~20KB)
- NullAway Gradle plugin can enforce null-safety at build time (add in Phase 2 if desired)
- Apache Commons Collections added as a dependency (`org.apache.commons:commons-collections4`)
- Apache Commons Lang (`commons-lang3`) is NOT added — stdlib covers all use cases in Java 26

# ADR 008 — Java Records for DTOs, Drop Lombok @Value

**Status:** Accepted
**Date:** 2026-03-27

## Context

The initial design used Lombok `@Value` for immutable DTOs. Java 26 also introduces Valhalla `value class` (preview). Having both Lombok `@Value` and Valhalla `value class` in the same codebase creates naming confusion and redundancy.

## Decision

Use **Java `record`** for all DTOs and request/response objects. Drop Lombok `@Value` entirely.

Lombok is still used for:
- `@RequiredArgsConstructor` — constructor injection on Spring beans
- `@Slf4j` — logger declaration
- `@Builder` — complex object construction where records aren't sufficient

## Examples

```java
// Request DTO — record
public record RegistryCreateRequest(
    @NotBlank String name,
    String description,
    RegistryVisibility visibility
) {}

// Response DTO — record
public record RegistryResponse(
    UUID id,
    String name,
    String slug,
    RegistryVisibility visibility,
    int itemCount,
    Instant createdAt
) {}

// For complex construction patterns, @Builder on a record is fine:
@Builder
public record ItemResponse(
    UUID id,
    String title,
    String imageUrl,
    BigDecimal price,
    String currency,
    ItemFlag flag,
    int quantityDesired,
    int quantityClaimed,
    String notes
) {}
```

## Consequences

- Records give immutability, `equals`/`hashCode`/`toString` for free — no Lombok needed
- `@Builder` can still be applied to records when construction is complex (>5 fields)
- Valhalla `value class` is reserved for true domain value objects (`Money`, `RegistrySlug`) where identity-free semantics and stack allocation matter
- No Lombok `@Value` vs Valhalla `value class` naming confusion

# Java Coding Style Guide — Storkly

Enforced automatically by **Spotless** (`./gradlew spotlessApply`).
Pre-configured — no manual setup needed.

---

## Brace Style

Opening `{` at **line end** (K&R).
`else`, `else if`, `catch`, `finally` always on a **new line**.
Braces are **always required** — never omit for single-statement blocks.

```java
if (registry.isPublic()) {
    return registryHelper.toPublicResponse(registry);
}
else if (registryHelper.isSubscriber(registry, currentUser)) {
    return registryHelper.toSubscriberResponse(registry);
}
else {
    throw new AccessDeniedException("Registry is private");
}
```

```java
try {
    return scraperService.scrape(url);
}
catch (ScrapingException e) {
    log.warn("Scraping failed for url={}", url, e);
    return ScrapeResult.unsupported(url);
}
finally {
    scraperMetrics.recordAttempt(url);
}
```

Single-statement — still requires braces:
```java
// Bad
if (condition)
    doSomething();

// Good
if (condition) {
    doSomething();
}
```

---

## Method Signatures — Break at >2 Parameters

```java
// 1-2 params — single line
public RegistryResponse findBySlug(String slug) { ... }
public void assertOwner(UUID registryId, UUID userId) { ... }

// 3+ params — each on its own line; closing paren + opening brace on last param's line
public ItemResponse createItem(
    UUID registryId,
    ItemCreateRequest request,
    User currentUser
) {
    registryHelper.assertOwnerOrCoOwner(registryId, currentUser.id());
    Item saved = itemRepository.save(
        itemHelper.toEntity(request, registryId, currentUser)
    );
    return itemHelper.toResponse(saved);
}
```

Same rule for method calls when chaining gets long:
```java
// Long call chain — break after opening paren
return registryRepository.save(
    registryHelper.toEntity(request, slug, owner)
);
```

---

## Lombok

Use `@RequiredArgsConstructor` for all Spring beans — no manual constructors.
Use `@Slf4j` — no manual `Logger` declaration.
**DTOs use Java records** (ADR-008) — not Lombok `@Value`.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RegistryService {

    private final RegistryRepository registryRepository;
    private final RegistryHelper registryHelper;

    public RegistryResponse create(RegistryCreateRequest request, User owner) {
        log.info("Creating registry for owner={}", owner.id());
        String slug = SlugUtil.generate(request.name());
        registryHelper.assertSlugAvailable(slug);
        return registryHelper.toResponse(
            registryRepository.save(registryHelper.toEntity(request, slug, owner))
        );
    }
}
```

```java
// Request DTO — plain record
public record RegistryCreateRequest(
    @NotBlank String name,
    String description,
    RegistryVisibility visibility
) {}

// Response DTO — record with @Builder for complex construction
@Builder
public record RegistryResponse(
    UUID id,
    String name,
    String slug,
    RegistryVisibility visibility,
    int itemCount,
    Instant createdAt
) {}
```

---

## Helper vs Util

| | Helper | Util |
|---|---|---|
| Annotation | `@Component` (Spring bean) | Final class, private constructor |
| Has dependencies | Yes — via `@RequiredArgsConstructor` | No |
| Methods | Instance methods | Static methods only |
| Lives in | `service/` module | `util/` module |
| Purpose | Entity↔DTO mapping, business predicates | Pure transformations, no state |

```java
// Helper — Spring bean, has deps
@Component
@RequiredArgsConstructor
public class ItemHelper {

    private final CategoryRepository categoryRepository;

    public Item toEntity(
        ItemCreateRequest request,
        UUID registryId,
        User addedBy
    ) {
        Category category = categoryRepository.findByIdOrThrow(request.categoryId());
        return new Item(
            UUID.randomUUID(),
            registryId,
            category.id(),
            addedBy.id(),
            request.urlOriginal(),
            SourceSite.MANUAL,
            request.title(),
            request.flag() != null ? request.flag() : ItemFlag.EXACT_ONLY,
            request.quantityDesired() != null ? request.quantityDesired() : 1
        );
    }
}

// Util — pure static, no Spring
public final class SlugUtil {
    private SlugUtil() {}

    public static String generate(String name) {
        return name.toLowerCase()
            .trim()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("[\\s-]+", "-")
            .replaceAll("^-|-$", "");
    }
}
```

---

## var — Minimise

Only when the type is long and immediately obvious from the right-hand side.

```java
// OK — verbose generic, type obvious from Collectors
var grouped = items.stream().collect(Collectors.groupingBy(Item::categoryId));

// Not OK
var result = registryService.create(request, user);          // bad
RegistryResponse result = registryService.create(...);       // good

var items = itemRepository.findByRegistryId(id);             // bad
List<Item> items = itemRepository.findByRegistryId(id);      // good
```

---

## Services — Layered Responsibilities

| Layer | Responsibility | Should NOT do |
|---|---|---|
| Controller | Parse request, call service, return HTTP response | Business logic, repo access |
| Service | Orchestrate: validate, call repos/helpers, return DTO | Entity construction, mapping |
| Helper | Entity↔DTO mapping, complex predicates | Repo calls outside own domain |
| Repository | DB access via JOOQ DSL | Business logic |
| Util | Pure transformations | Anything stateful |

```java
// Controller — just wiring
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public ItemResponse create(
    @PathVariable UUID registryId,
    @RequestBody @Valid ItemCreateRequest request,
    @AuthenticationPrincipal User currentUser
) {
    return itemService.create(registryId, request, currentUser);
}

// Service — orchestrates
public ItemResponse create(
    UUID registryId,
    ItemCreateRequest request,
    User currentUser
) {
    registryHelper.assertOwnerOrCoOwner(registryId, currentUser.id());
    Item saved = itemRepository.save(itemHelper.toEntity(request, registryId, currentUser));
    return itemHelper.toResponse(saved);
}
```

---

## Valhalla Value Classes (Java 26 Preview)

Compile with `--enable-preview`. Mark with `// Valhalla: value class`.

```java
// Valhalla: value class
public value class Money {
    BigDecimal amount;
    String currency;

    public static Money of(BigDecimal amount, String currency) {
        return new Money(amount, currency);
    }
}
```

Candidate value classes in Storkly: `Money`, `RegistrySlug`, `ClaimToken`.

---

## Spotless — Auto-formatter

Configured in `build.gradle.kts` using **Palantir Java Format** (supports this brace style).
**No manual setup required.**

```bash
./gradlew spotlessApply   # auto-format all Java files
./gradlew check           # fails if formatting is off
```

`.editorconfig` at repo root ensures consistent indentation in your IDE:
```ini
[*.java]
indent_style = space
indent_size = 4
```

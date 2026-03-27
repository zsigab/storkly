# Storkly Backend — Agent Instructions

Spring Boot 4 / Java 26 backend for the Storkly gift registry application.
Multi-module Gradle (Kotlin DSL) project.

> **Spring Boot 4 / Java 26 note:** Verify the exact release state before use.
> **Fallback:** If Spring Boot 4 is not yet GA, use Spring Boot 3.5.x with Java 25 (LTS).
> The architecture, module structure, and coding patterns do not change — only version numbers.
> Valhalla value classes require `--enable-preview`; mark all usages with
> `// Valhalla: value class` so they're easy to grep. If Java 26 is not GA, use Java 25
> and skip Valhalla features.

---

## CRITICAL — Do NOT

These are explicit anti-patterns. Do not introduce them under any circumstances:

- **Do NOT add Spring Data JPA or Hibernate.** No `@Entity`, `@Repository` (Spring Data),
  `@OneToMany`, `@ManyToOne`, or any JPA annotation. We use JOOQ exclusively (ADR-003).
- **Do NOT add H2.** No H2 dependency, no H2 profiles, no H2 fallback.
  All profiles use PostgreSQL (ADR-007).
- **Do NOT use Lombok `@Value` or `@Data`.** DTOs are Java records (ADR-008).
  Lombok is only for `@RequiredArgsConstructor`, `@Slf4j`, `@Builder`.
- **Do NOT create a monolithic `application.properties`.** Use `application.yml` with
  profile-specific `application-{profile}.yml` files.
- **Do NOT skip Spotless configuration.** It must be configured in the root `build.gradle.kts`
  from the first commit. Run `./gradlew spotlessApply` before every commit.
- **Do NOT hardcode secrets.** Use environment variables for DB passwords, JWT secrets,
  API keys. Provide `.env.example`, never `.env`.
- **Do NOT add features not in the current phase.** If working on Phase 1, do not add
  scraping, OAuth providers, or any Phase 2 feature.
- **Do NOT use `var`** unless the type is long and immediately obvious from the RHS.
- **Do NOT omit braces** on single-statement if/else/for/while blocks.
- **Do NOT use `SecurityFilterChain` that permits all requests.** Even in local dev,
  configure proper security with explicit path matchers. Public endpoints are allowlisted;
  everything else requires authentication.
- **Do NOT use Jackson 2 imports** (`com.fasterxml.jackson.*`). Spring Boot 4 ships
  Jackson 3 — use `tools.jackson.*` imports.
- **Do NOT use `RestTemplate` or raw `WebClient` for external HTTP calls.** Declare an
  HTTP Service Client interface with `@GetExchange`/`@PostExchange`.
- **Do NOT use `ExecutorService` + `Future` for parallel work.** Use Java 26
  `StructuredTaskScope` with virtual threads.
- **Do NOT use `TestRestTemplate` in new tests.** Use `RestTestClient` (Spring Boot 4).

---

## Stack

- **Java 26** (`--enable-preview` for Valhalla value classes)
- **Spring Boot 4** (Spring Framework 7, Jakarta EE 11)
- **Spring Security** — email/password + OAuth2 (Google + Facebook, Phase 2)
- **Passwords** — `Argon2PasswordEncoder` (Spring Security crypto, OWASP recommended)
- **JOOQ OSS** — typesafe SQL DSL, generated from Flyway schema (free for PostgreSQL)
- **Flyway** — schema migrations, single source of truth for the DB schema
- **Lombok** — `@RequiredArgsConstructor`, `@Slf4j`, `@Builder` (DTOs use Java records — ADR-008)
- **Jackson 3** — JSON serialization (`tools.jackson.*` imports, not `com.fasterxml.*`)
- **HTTP Service Clients** — declarative `@GetExchange`/`@PostExchange` interfaces for external APIs
- **Structured Concurrency** — `StructuredTaskScope` for parallel work (Java 26 preview)
- **Cloudflare Turnstile** — CAPTCHA verified server-side on registration (via HTTP Service Client)
- **Spring Mail** — Mailpit locally, Brevo in prod
- **Playwright (Java)** — headless browser for JS-heavy scrapers (Phase 2)
- **Jsoup** — HTML scraping for simpler sites (Phase 2)

---

## Module Structure

```
backend/
  settings.gradle.kts          ← declares all submodules
  build.gradle.kts             ← shared config: Java 26, Lombok, common test deps

  util/                        ← pure Java, NO Spring dependencies
    src/main/java/app/storkly/util/
      SlugUtil.java
      TokenUtil.java
      MoneyUtil.java

  domain/                      ← entities, repository interfaces, enums, exceptions
    src/main/java/app/storkly/domain/
      registry/
        Registry.java           ← entity (JOOQ record or manual)
        RegistryRepository.java ← interface only; implemented in web/infrastructure
        RegistryInvite.java
        RegistryCoOwner.java
        RegistryVisibility.java ← enum
      item/
        Item.java
        ItemRepository.java
        ItemFlag.java           ← enum: EXACT_ONLY, SIMILAR_OK, SIMILAR_CHEAPER
        Claim.java
        ClaimRepository.java
      user/
        User.java
        UserRepository.java
        AuthProvider.java       ← enum: LOCAL, GOOGLE, FACEBOOK
      category/
        Category.java
        CategoryRepository.java
      exception/
        RegistryNotFoundException.java
        ItemNotFoundException.java
        AccessDeniedException.java
        SlugConflictException.java
        ... (one file per domain exception)

  service/                     ← application services + @Component helpers
    src/main/java/app/storkly/service/
      registry/
        RegistryService.java
        RegistryHelper.java
      item/
        ItemService.java
        ItemHelper.java
      claim/
        ClaimService.java
        ClaimHelper.java
      category/
        CategoryService.java
      user/
        UserService.java
        UserHelper.java
      auth/
        AuthService.java        ← registration, login, password reset
        EmailVerificationService.java
        TurnstileService.java   ← Cloudflare CAPTCHA verification
      email/
        EmailService.java       ← Spring Mail wrapper

  scraper/                     ← Phase 2 only
    src/main/java/app/storkly/scraper/
      ScraperService.java
      ScrapeResult.java
      lazada/LazadaScraper.java
      shopee/ShopeeScraper.java
      amazon/AmazonScraper.java
      galaxus/GalaxusScraper.java

  web/                         ← Spring Boot app: controllers, DTOs, config, main()
    src/main/java/app/storkly/
      StorklyApplication.java  ← @SpringBootApplication main class
      registry/
        RegistryController.java
        dto/
          RegistryCreateRequest.java   ← Java record
          RegistryResponse.java        ← Java record
          RegistryInviteResponse.java  ← Java record
      item/
        ItemController.java
        dto/
          ItemCreateRequest.java
          ItemResponse.java
          ClaimCreateRequest.java
          ClaimResponse.java
      category/
        CategoryController.java
        dto/
          CategoryCreateRequest.java
          CategoryResponse.java
      auth/
        AuthController.java
        dto/
          RegisterRequest.java
          LoginRequest.java
          TokenResponse.java
      user/
        UserController.java
        dto/
          UserProfileResponse.java
      config/
        SecurityConfig.java
        JooqConfig.java
        OpenApiConfig.java
        CorsConfig.java
      exception/
        GlobalExceptionHandler.java
    src/main/resources/
      db/migration/            ← Flyway scripts
      application.yml
      application-local.yml
      application-test.yml
```

### Module dependency graph

```
util  ←  domain  ←  service  ←  web
                  ←  scraper  ↗
```

Nothing lower in the stack imports from a higher module.
`web` wires everything together via Spring's component scan.

---

## Java Coding Style

### Braces

Opening `{` stays at **line end** (K&R). But `else`, `else if`, `catch`, `finally`
always start on a **new line**. Braces are **always required** — never omit them.

```java
public RegistryResponse findBySlug(String slug, User currentUser) {
    Registry registry = registryRepository.findBySlugOrThrow(slug);

    if (registry.isPublic()) {
        return registryHelper.toPublicResponse(registry);
    }
    else if (registryHelper.isOwnerOrCoOwner(registry.id(), currentUser.id())) {
        return registryHelper.toOwnerResponse(registry);
    }
    else if (registryHelper.isSubscriber(registry.id(), currentUser.id())) {
        return registryHelper.toSubscriberResponse(registry);
    }
    else {
        throw new AccessDeniedException("Registry is private");
    }
}
```

```java
try {
    ScrapeResult result = scraperService.scrape(url);
    return itemHelper.applyScrapedData(item, result);
}
catch (ScrapingException e) {
    log.warn("Scraping failed for url={}", url, e);
    return item;
}
finally {
    scraperMetrics.recordAttempt(url);
}
```

### Method Signatures — Break at >2 Parameters

```java
// 1-2 params — single line is fine
public RegistryResponse findBySlug(String slug) { ... }
public void assertOwner(UUID registryId, UUID userId) { ... }

// 3+ params — each parameter on its own line
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

### Lombok

Use `@RequiredArgsConstructor` for constructor injection (all `final` fields).
No manual constructors unless there is a specific reason.

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RegistryService {

    private final RegistryRepository registryRepository;
    private final RegistryHelper registryHelper;
    private final CategoryRepository categoryRepository;

    public RegistryResponse create(RegistryCreateRequest request, User owner) {
        String slug = SlugUtil.generate(request.name());
        registryHelper.assertSlugAvailable(slug);
        Registry saved = registryRepository.save(
            registryHelper.toEntity(request, slug, owner)
        );
        return registryHelper.toResponse(saved);
    }
}

@Component
@RequiredArgsConstructor
public class RegistryHelper {

    private final RegistryRepository registryRepository;

    public boolean isOwnerOrCoOwner(UUID registryId, UUID userId) {
        return registryRepository.existsByIdAndOwnerOrCoOwner(registryId, userId);
    }

    public RegistryResponse toResponse(Registry registry) {
        return RegistryResponse.builder()
            .id(registry.id())
            .name(registry.name())
            .slug(registry.slug())
            .visibility(registry.visibility())
            .build();
    }

    public void assertSlugAvailable(String slug) {
        if (registryRepository.existsBySlug(slug)) {
            throw new SlugConflictException(slug);
        }
    }
}
```

**DTOs use Java records** (ADR-008) — no Lombok `@Value`. Records provide immutability,
`equals`/`hashCode`/`toString` for free. Use `@Builder` on records when construction is complex:

```java
// Simple DTO — plain record
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

Use `@Slf4j` instead of declaring the logger manually:
```java
@Slf4j
public class SomeClass {
    // log is available automatically
    public void doThing() {
        log.info("doing thing");
        log.warn("something odd: {}", value);
    }
}
```

### Helper vs Util

**`Helper`** — `@Component` Spring bean. Has injected dependencies. Lives in `service/` module.
```java
@Component
@RequiredArgsConstructor
public class ItemHelper {
    private final CategoryRepository categoryRepository;

    public Item toEntity(ItemCreateRequest request, UUID registryId, User addedBy) { ... }
    public ItemResponse toResponse(Item item) { ... }
}
```

**`Util`** — Final class, private constructor, all static. Lives in `util/` module. No Spring.
```java
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

### var — Minimise

Only use `var` when the type is long and immediately obvious from the right-hand side.

```java
// OK
var grouped = items.stream().collect(Collectors.groupingBy(Item::categoryId));

// Not OK — type is hidden
var result = registryService.create(request, user);         // bad
RegistryResponse result = registryService.create(...);      // good

var items = itemRepository.findByRegistryId(id);            // bad
List<Item> items = itemRepository.findByRegistryId(id);     // good
```

### Services — Stay Clean

Services orchestrate. Helpers do entity/DTO mapping and predicate checks. Controllers are thin.

```java
// Controller — thin: parse request, call service, return response
@RestController
@RequestMapping("/api/registries")
@RequiredArgsConstructor
public class RegistryController {

    private final RegistryService registryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistryResponse create(
        @RequestBody @Valid RegistryCreateRequest request,
        @AuthenticationPrincipal User currentUser
    ) {
        return registryService.create(request, currentUser);
    }
}

// Service — orchestrates: validation, repo calls, return DTO
@Service
@RequiredArgsConstructor
@Transactional
public class RegistryService {

    private final RegistryRepository registryRepository;
    private final RegistryHelper registryHelper;

    public RegistryResponse create(RegistryCreateRequest request, User owner) {
        String slug = SlugUtil.generate(request.name());
        registryHelper.assertSlugAvailable(slug);
        return registryHelper.toResponse(
            registryRepository.save(registryHelper.toEntity(request, slug, owner))
        );
    }
}
```

---

## Error Handling & HTTP Codes

One `@RestControllerAdvice` in `web/exception/GlobalExceptionHandler.java`.
Services throw typed domain exceptions; the handler maps them to RFC 7807 `ProblemDetail`.

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RegistryNotFoundException.class)
    public ProblemDetail handleNotFound(RegistryNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleForbidden(AccessDeniedException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(SlugConflictException.class)
    public ProblemDetail handleConflict(SlugConflictException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail detail = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        detail.setDetail("Validation failed");
        detail.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList());
        return detail;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred"
        );
    }
}
```

HTTP status mapping:

| Exception | HTTP Status |
|---|---|
| `*NotFoundException` | 404 Not Found |
| `AccessDeniedException` | 403 Forbidden |
| `SlugConflictException` | 409 Conflict |
| `MethodArgumentNotValidException` | 422 Unprocessable Entity |
| `AuthenticationException` | 401 Unauthorized |
| Unexpected `Exception` | 500 Internal Server Error |

---

## Database — PostgreSQL + JOOQ + Flyway (ADR-003, ADR-007)

**PostgreSQL everywhere** — no H2. Flyway scripts can use PostgreSQL-specific features
(UUID, JSONB, TEXT, `TIMESTAMP WITH TIME ZONE`, etc.).

Flyway owns the schema (scripts in `web/src/main/resources/db/migration/`).
JOOQ uses **DDL-based codegen** — parses Flyway SQL files directly, no running DB needed
at build time.

Never write raw SQL strings — always use the JOOQ DSL:

```java
// Good
context.selectFrom(ITEM)
    .where(ITEM.REGISTRY_ID.eq(registryId))
    .and(ITEM.DELETED_AT.isNull())
    .orderBy(ITEM.SORT_ORDER.asc())
    .fetchInto(ItemRecord.class);

// Bad
"SELECT * FROM item WHERE registry_id = ? AND deleted_at IS NULL ORDER BY sort_order"
```

### Local dev
PostgreSQL on the host via Podman (distrobox shares network):
```bash
podman run -d --name storkly-pg -p 5432:5432 \
  -e POSTGRES_DB=storkly -e POSTGRES_USER=storkly -e POSTGRES_PASSWORD=storkly \
  postgres:16-alpine
```

### Integration tests
Use **Testcontainers** (PostgreSQL). Unit tests mock repositories — no DB needed.

---

## Auth

- `Argon2PasswordEncoder` — OWASP recommended, PHC 2015 winner
- JWT: access token 15 min, refresh token 7 days, stored in httpOnly cookies
- OAuth2 (Phase 2): Spring Authorization Server, Google + Facebook providers
- Never roll custom crypto. Only use Spring Security's provided encoders.

---

## Java 26 Features — Use These

Java 26 requires `--enable-preview`. Use these features where they fit naturally.

### Valhalla Value Classes

Identity-free classes that behave like primitives (no `synchronized`, no `==` identity).
Mark all usages with `// Valhalla: value class` for easy tracking.

```java
// Valhalla: value class
public value class Money {
    BigDecimal amount;
    String currency;

    public static Money of(BigDecimal amount, String currency) {
        return new Money(amount, currency);
    }
}

// Valhalla: value class
public value class RegistrySlug {
    String value;

    public static RegistrySlug of(String value) {
        return new RegistrySlug(value);
    }
}
```

Candidates in Storkly: `Money`, `RegistrySlug`, `ClaimToken`.

### Structured Concurrency (`StructuredTaskScope`)

Use for any parallel work (e.g. fetching multiple APIs, parallel DB lookups).
Never use raw `ExecutorService` + `Future` — always `StructuredTaskScope`.

```java
import java.util.concurrent.StructuredTaskScope;

// ShutdownOnFailure — cancels all if one fails
public RegistryDetailResponse loadRegistryDetail(UUID registryId) throws Exception {
    try (var scope = StructuredTaskScope.open(
            StructuredTaskScope.Joiner.awaitAllSuccessfulOrThrow())) {

        StructuredTaskScope.Subtask<Registry> registryTask =
            scope.fork(() -> registryRepository.findByIdOrThrow(registryId));
        StructuredTaskScope.Subtask<List<Item>> itemsTask =
            scope.fork(() -> itemRepository.findByRegistryId(registryId));
        StructuredTaskScope.Subtask<List<Category>> categoriesTask =
            scope.fork(() -> categoryRepository.findByRegistryId(registryId));

        scope.join();

        return new RegistryDetailResponse(
            registryTask.get(),
            itemsTask.get(),
            categoriesTask.get()
        );
    }
}

// ShutdownOnSuccess — returns first successful result, cancels the rest
public ScrapeResult scrapeFirstAvailable(String url) throws Exception {
    try (var scope = StructuredTaskScope.open(
            StructuredTaskScope.Joiner.anySuccessfulResultOrThrow())) {

        scope.fork(() -> amazonScraper.scrape(url));
        scope.fork(() -> galaxusScraper.scrape(url));

        return scope.join();
    }
}
```

### Primitive Types in Patterns, `instanceof`, and Switch

Use primitives directly in `switch` expressions and pattern matching. No boxing needed.

```java
// Primitive switch — use instead of if/else chains on int/long/byte
public String quantityLabel(int quantity) {
    return switch (quantity) {
        case 0 -> "None needed";
        case 1 -> "One needed";
        case int q when q <= 5 -> q + " needed";
        case int q -> q + " needed (bulk)";
    };
}

// Primitive pattern in instanceof — direct narrowing without casting
public void processNumericField(long value) {
    if (value instanceof int i) {
        // safe narrowing: value fits in int, use i directly
        handleIntValue(i);
    }
    else {
        handleLongValue(value);
    }
}

// Combined with sealed types
public double computeDiscount(Object amount) {
    return switch (amount) {
        case int i when i > 100 -> i * 0.1;
        case int i -> i * 0.05;
        case double d when d > 100.0 -> d * 0.1;
        case double d -> d * 0.05;
        default -> 0;
    };
}
```

### Lazy Constants (`StableValue`)

Use for expensive-to-initialise singletons and lazy fields. Replaces the double-checked locking pattern.
The JVM treats these as true constants for optimisation — same performance as `final`.

```java
import java.lang.StableValue;

public class ScraperRegistry {

    // Lazy singleton — computed once on first access, thread-safe
    private final StableValue<PlaywrightBrowser> browser = StableValue.of();

    public PlaywrightBrowser getBrowser() {
        return browser.orElseSet(() -> PlaywrightBrowser.launch());
    }
}

// Lazy per-enum-constant initialisation
public enum SourceSite {
    AMAZON, GALAXUS, SHOPEE, LAZADA;

    private final StableValue<Pattern> urlPattern = StableValue.of();

    public Pattern urlPattern() {
        return urlPattern.orElseSet(() -> Pattern.compile(buildRegex()));
    }
}
```

### HTTP/3 for HttpClient

Spring Boot 4's `HttpClient` auto-enables HTTP/3 when available. No code changes needed —
just be aware that `java.net.http.HttpClient` now negotiates HTTP/3 automatically.

---

## Spring Boot 4 Features — Use These

### HTTP Service Clients (Declarative REST)

Use for **all external API calls** (Turnstile verification, scrapers, etc.).
Declare an interface + Spring auto-generates the implementation.

```java
// Define the client as an interface
public interface TurnstileClient {

    @PostExchange("/siteverify")
    TurnstileResponse verify(@RequestBody TurnstileRequest request);
}

// Request/response are plain records
public record TurnstileRequest(String secret, String response) {}
public record TurnstileResponse(boolean success, List<String> errorCodes) {}

// Wire it up in config
@Configuration
public class TurnstileConfig {

    @Bean
    public TurnstileClient turnstileClient(RestClient.Builder builder) {
        RestClient restClient = builder
            .baseUrl("https://challenges.cloudflare.com/turnstile/v0")
            .build();
        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()
            .createClient(TurnstileClient.class);
    }
}

// Use in service — just inject and call
@Service
@RequiredArgsConstructor
public class TurnstileService {

    private final TurnstileClient turnstileClient;
    private final TurnstileProperties properties;

    public boolean verify(String token) {
        TurnstileResponse response = turnstileClient.verify(
            new TurnstileRequest(properties.secretKey(), token)
        );
        return response.success();
    }
}
```

**Do NOT** use `RestTemplate` or raw `WebClient` for external calls — always declare an
HTTP Service Client interface.

### Jackson 3 (Jackson 2 is Deprecated)

Spring Boot 4 ships Jackson 3. The package changed from `com.fasterxml.jackson` to
`tools.jackson`. Use the new imports:

```java
// Old (Jackson 2) — DO NOT USE
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

// New (Jackson 3) — USE THIS
import tools.jackson.annotation.JsonProperty;
import tools.jackson.databind.ObjectMapper;
```

Spring auto-configures the Jackson 3 `ObjectMapper` bean. No manual config needed.

### RestTestClient for Integration Tests

Use `RestTestClient` instead of `TestRestTemplate` for new integration tests. Works with
both `MockMvc` (no server) and `WebTestClient` (running server).

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class RegistryControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("storkly_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private RestTestClient restTestClient;

    @Test
    void createRegistry_returnsCreated() {
        RegistryCreateRequest request = new RegistryCreateRequest(
            "Baby Shower", "Our wishlist", RegistryVisibility.PUBLIC
        );

        restTestClient.post().uri("/api/registries")
            .body(request)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(RegistryResponse.class)
            .value(r -> assertThat(r.slug()).isEqualTo("baby-shower"));
    }
}
```

### Renamed Config Properties

Use the new property names. The old names are deprecated:

| Old (deprecated) | New |
|---|---|
| `management.tracing.enabled` | `management.tracing.export.enabled` |
| `spring.dao.exceptiontranslation.enabled` | `spring.persistence.exceptiontranslation.enabled` |

### Console Logging Control

```yaml
# application-test.yml — suppress console noise in tests
logging:
  console:
    enabled: false
```

---

## Code Style Enforcement — Spotless

Pre-configured in `build.gradle.kts`. **You do not need to set this up yourself.**
Run: `./gradlew spotlessApply` to auto-format.
Build fails on `./gradlew check` if formatting is off.

Uses **Palantir Java Format** (compatible with the K&R + next-line-else style).

---

## Gradle Version Catalog

All dependency versions are centralized in `gradle/libs.versions.toml`. Never hardcode
versions in `build.gradle.kts` — always reference the catalog.

```toml
# gradle/libs.versions.toml
[versions]
spring-boot = "4.0.0"   # or "3.5.x" if 4 is not GA
jooq = "3.20.1"          # verify latest OSS
flyway = "11.x"
lombok = "1.18.36"
testcontainers = "1.20.x"
spotless = "7.0.2"

[libraries]
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-starter-security = { module = "org.springframework.boot:spring-boot-starter-security" }
spring-boot-starter-mail = { module = "org.springframework.boot:spring-boot-starter-mail" }
jooq = { module = "org.jooq:jooq", version.ref = "jooq" }
jooq-meta-extensions = { module = "org.jooq:jooq-meta-extensions", version.ref = "jooq" }
flyway-core = { module = "org.flywaydb:flyway-core", version.ref = "flyway" }
flyway-postgres = { module = "org.flywaydb:flyway-database-postgresql", version.ref = "flyway" }
postgresql = { module = "org.postgresql:postgresql" }
lombok = { module = "org.projectlombok:lombok", version.ref = "lombok" }
jspecify = { module = "org.jspecify:jspecify:1.0.0" }
testcontainers-postgres = { module = "org.testcontainers:postgresql", version.ref = "testcontainers" }
testcontainers-junit = { module = "org.testcontainers:junit-jupiter", version.ref = "testcontainers" }

[plugins]
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spotless = { id = "com.diffplug.spotless", version.ref = "spotless" }
jooq-codegen = { id = "org.jooq.jooq-codegen-gradle", version.ref = "jooq" }
```

> **Important:** Verify all version numbers against actual releases before using.
> The versions above are best-guess estimates.

---

## JOOQ DDL-Based Codegen — Full Gradle Config

This is the exact JOOQ codegen config for the `domain` module. It parses Flyway SQL files
directly — no running database needed at build time.

```kotlin
// domain/build.gradle.kts
plugins {
    alias(libs.plugins.jooq.codegen)
}

dependencies {
    jooqCodegen(libs.jooq.meta.extensions)
    jooqCodegen(libs.postgresql)  // for dialect
}

jooq {
    configuration {
        generator {
            database {
                name = "org.jooq.meta.extensions.ddl.DDLDatabase"
                properties {
                    property {
                        key = "scripts"
                        value = "src/main/resources/db/migration/*.sql"
                    }
                    property {
                        key = "sort"
                        value = "flyway"
                    }
                    property {
                        key = "defaultNameCase"
                        value = "lower"
                    }
                }
            }
            target {
                packageName = "app.storkly.domain.generated"
                directory = "build/generated-sources/jooq"
            }
            generate {
                isRecords = true
                isPojos = false        // we use our own records, not JOOQ POJOs
                isDaos = false         // we write our own repositories
                isFluentSetters = false
            }
        }
    }
}
```

> The `domain/src/main/resources/db/migration/` directory contains the Flyway scripts.
> JOOQ reads these at build time and generates classes in `build/generated-sources/jooq/`.
> These generated sources are NOT committed to git.

---

## Spring Security — Starter Config

This is the Phase 1 security configuration. It must be secure by default — public endpoints
are explicitly allowlisted, everything else requires authentication.

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // REST API with JWT, no CSRF needed
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — explicitly listed
                .requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/verify-email").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/forgot-password").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/registries/{slug}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/registries/{slug}/items").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/registries/{slug}/categories").permitAll()
                .requestMatchers("/api/docs/**", "/swagger-ui/**").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(16, 32, 1, 65536, 3);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173"  // Vite dev server
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
```

---

## Integration Test Pattern — Testcontainers + RestTestClient

See the **RestTestClient** example in the "Spring Boot 4 Features" section above.
Use `RestTestClient` (not `TestRestTemplate`) for all new integration tests.

> Note: Testcontainers requires Docker or Podman access. If not available in distrobox,
> run integration tests in CI only. Unit tests (mocked repos) always work locally.

---

## Git Workflow

- **Commit after each granular sub-task** (e.g. 1A, 1B, ...) — never batch unrelated work
- **Push each commit** to the remote
- **Commit message format:**

```
Topic: concise summary

ADR-NNN: short decision summary (only when relevant)

Co-Authored-By: Claude <co-author>
```

- Run `./gradlew spotlessApply` before every commit
- Run `./gradlew check` to verify build + formatting passes
- Non-obvious reasoning goes into numbered ADRs in `docs/decisions/`

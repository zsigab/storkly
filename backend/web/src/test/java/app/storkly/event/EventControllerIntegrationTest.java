package app.storkly.event;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.event.dto.EventCreateRequest;
import java.time.OffsetDateTime;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestPropertySource(properties = {"storkly.captcha.enabled=false", "storkly.seed-data=true"})
class EventControllerIntegrationTest {

  @Container
  @ServiceConnection
  static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

  @LocalServerPort
  int port;

  RestTestClient restTestClient;

  @BeforeEach
  void setUp() {
    restTestClient = RestTestClient.bindToServer()
        .baseUrl("http://localhost:" + port)
        .build();
  }

  @Test
  void listEvents_unauthenticated_returnsUnauthorized() {
    restTestClient
        .get()
        .uri("/api/events")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void createEvent_unauthenticated_returnsUnauthorized() {
    restTestClient
        .post()
        .uri("/api/events")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void getEvent_unauthenticated_returnsUnauthorized() {
    restTestClient
        .get()
        .uri("/api/events/00000000-0000-0000-0000-000000000001")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void patchEvent_unauthenticated_returnsUnauthorized() {
    restTestClient
        .patch()
        .uri("/api/events/00000000-0000-0000-0000-000000000001")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void deleteEvent_unauthenticated_returnsUnauthorized() {
    restTestClient
        .delete()
        .uri("/api/events/00000000-0000-0000-0000-000000000001")
        .exchange()
        .expectStatus()
        .isUnauthorized();
  }

  @Test
  void getPublicEvent_unknownId_returnsNotFound() {
    restTestClient
        .get()
        .uri("/api/events/00000000-0000-0000-0000-000000000001/public")
        .exchange()
        .expectStatus()
        .isNotFound();
  }

  @Test
  void createEvent_authenticated_returnsCreated() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest request = new EventCreateRequest(
        "New Event",
        OffsetDateTime.now().plusDays(1),
        "Test Location");

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", authCookie)
        .body(request)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.title")
        .isEqualTo("New Event")
        .jsonPath("$.location")
        .isEqualTo("Test Location")
        .jsonPath("$.rsvpToken")
        .isNotEmpty();
  }

  @Test
  void getEvent_authenticated_owner_returnsEvent() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest request = new EventCreateRequest(
        "Test Event",
        OffsetDateTime.now().plusDays(1),
        "Test Location");

    AtomicReference<String> eventIdRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", authCookie)
        .body(request)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.id")
        .value(id -> eventIdRef.set((String) id));

    restTestClient
        .get()
        .uri("/api/events/" + eventIdRef.get())
        .cookie("access_token", authCookie)
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.title")
        .isEqualTo("Test Event");
  }

  @Test
  void getEvent_authenticated_nonOwner_returnsForbidden() {
    String ownerCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest request = new EventCreateRequest(
        "Secret Event",
        OffsetDateTime.now().plusDays(1),
        null);

    AtomicReference<String> eventIdRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", ownerCookie)
        .body(request)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.id")
        .value(id -> eventIdRef.set((String) id));

    String otherUserCookie = loginAndGetCookie("gifter@example.com", "password");

    restTestClient
        .get()
        .uri("/api/events/" + eventIdRef.get())
        .cookie("access_token", otherUserCookie)
        .exchange()
        .expectStatus()
        .isForbidden();
  }

  @Test
  void patchEvent_authenticated_owner_returnsUpdated() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest createRequest = new EventCreateRequest(
        "Original Title",
        OffsetDateTime.now().plusDays(1),
        "Original Location");

    AtomicReference<String> eventIdRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", authCookie)
        .body(createRequest)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.id")
        .value(id -> eventIdRef.set((String) id));

    OffsetDateTime newDate = OffsetDateTime.now().plusDays(5);
    app.storkly.event.dto.EventUpdateRequest updateRequest = new app.storkly.event.dto.EventUpdateRequest(
        "Updated Title",
        newDate,
        "Updated Location");

    restTestClient
        .patch()
        .uri("/api/events/" + eventIdRef.get())
        .cookie("access_token", authCookie)
        .body(updateRequest)
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.title")
        .isEqualTo("Updated Title")
        .jsonPath("$.location")
        .isEqualTo("Updated Location");
  }

  @Test
  void deleteEvent_authenticated_owner_returnsNoContent() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest request = new EventCreateRequest(
        "To Delete",
        OffsetDateTime.now().plusDays(1),
        null);

    AtomicReference<String> eventIdRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", authCookie)
        .body(request)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.id")
        .value(id -> eventIdRef.set((String) id));

    restTestClient
        .delete()
        .uri("/api/events/" + eventIdRef.get())
        .cookie("access_token", authCookie)
        .exchange()
        .expectStatus()
        .isNoContent();

    restTestClient
        .get()
        .uri("/api/events/" + eventIdRef.get())
        .cookie("access_token", authCookie)
        .exchange()
        .expectStatus()
        .isNotFound();
  }

  @Test
  void getPublicEvent_authenticated_returnsPublicInfo() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    EventCreateRequest request = new EventCreateRequest(
        "Public Event",
        OffsetDateTime.now().plusDays(1),
        "Public Location");

    AtomicReference<String> eventIdRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/events")
        .cookie("access_token", authCookie)
        .body(request)
        .exchange()
        .expectStatus()
        .isCreated()
        .expectBody()
        .jsonPath("$.id")
        .value(id -> eventIdRef.set((String) id));

    restTestClient
        .get()
        .uri("/api/events/" + eventIdRef.get() + "/public")
        .exchange()
        .expectStatus()
        .isOk()
        .expectBody()
        .jsonPath("$.title")
        .isEqualTo("Public Event")
        .jsonPath("$.location")
        .isEqualTo("Public Location")
        .jsonPath("$.rsvpToken")
        .doesNotExist();
  }

  @Test
  void getEvent_unknownId_returnsNotFound() {
    String authCookie = loginAndGetCookie("owner@example.com", "password");

    restTestClient
        .get()
        .uri("/api/events/00000000-0000-0000-0000-000000000099")
        .cookie("access_token", authCookie)
        .exchange()
        .expectStatus()
        .isNotFound();
  }

  private String loginAndGetCookie(String email, String password) {
    AtomicReference<String> cookieRef = new AtomicReference<>();

    restTestClient
        .post()
        .uri("/api/auth/login")
        .body(new LoginRequest(email, password, false))
        .exchange()
        .expectStatus()
        .isOk()
        .expectHeader()
        .value(HttpHeaders.SET_COOKIE, setCookie -> {
          for (String part : setCookie.split(";")) {
            if (part.trim().startsWith("access_token=")) {
              cookieRef.set(part.trim().substring("access_token=".length()));
              break;
            }
          }
        });

    return cookieRef.get();
  }
}

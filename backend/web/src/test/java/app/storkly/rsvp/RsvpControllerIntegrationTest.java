package app.storkly.rsvp;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.rsvp.dto.RsvpSubmitRequest;
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
class RsvpControllerIntegrationTest {

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
    void getEventInfo_validToken_returnsEventDetails() {
        restTestClient
                .get()
                .uri("/api/rsvp/seed-rsvp-token-event001")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.eventTitle")
                .isEqualTo("Baby Shower Celebration")
                .jsonPath("$.eventDate")
                .isNotEmpty()
                .jsonPath("$.location")
                .isEqualTo("Community Center, 123 Main St");
    }

    @Test
    void getEventInfo_invalidToken_returnsUnauthorized() {
        restTestClient
                .get()
                .uri("/api/rsvp/invalid-token")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void submitRsvp_anonymous_returns200() {
        RsvpSubmitRequest request = new RsvpSubmitRequest("John Doe", "john@example.com", true, "test-token", null);

        restTestClient
                .post()
                .uri("/api/rsvp/seed-rsvp-token-event001")
                .body(request)
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void submitRsvp_authenticated_returns200() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        RsvpSubmitRequest request = new RsvpSubmitRequest("ignored", "ignored@example.com", false, "test-token", null);

        restTestClient
                .post()
                .uri("/api/rsvp/seed-rsvp-token-event001")
                .cookie("access_token", authCookie)
                .body(request)
                .exchange()
                .expectStatus()
                .isOk();
    }

    @Test
    void submitRsvp_invalidToken_returnsUnauthorized() {
        RsvpSubmitRequest request = new RsvpSubmitRequest("John Doe", "john@example.com", true, "test-token", null);

        restTestClient
                .post()
                .uri("/api/rsvp/invalid-token")
                .body(request)
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void confirmRsvp_validToken_returnsEventId() {
        restTestClient
                .get()
                .uri("/api/rsvp/confirm/seed-confirm-token-rsvp0001")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.eventId")
                .isNotEmpty();
    }

    @Test
    void confirmRsvp_invalidToken_returnsUnauthorized() {
        restTestClient
                .get()
                .uri("/api/rsvp/confirm/invalid-token")
                .exchange()
                .expectStatus()
                .isUnauthorized();
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

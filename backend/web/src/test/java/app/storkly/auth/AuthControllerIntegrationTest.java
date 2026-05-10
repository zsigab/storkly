package app.storkly.auth;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.auth.dto.RegisterRequest;
import app.storkly.auth.dto.VerifyEmailRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
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
class AuthControllerIntegrationTest {

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
    void register_returnsCreated() {
        RegisterRequest request = new RegisterRequest("bob@example.com", "password123", "Bob", "test-captcha-token");

        restTestClient
                .post()
                .uri("/api/auth/register")
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated();
    }

    @Test
    void register_duplicateEmail_returnsConflict() {
        // owner@example.com is seeded with a verified email — re-registering must return 409
        restTestClient
                .post()
                .uri("/api/auth/register")
                .body(new RegisterRequest("owner@example.com", "password123", "Owner", "test-captcha-token"))
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void register_invalidBody_returnsUnprocessableEntity() {
        restTestClient
                .post()
                .uri("/api/auth/register")
                .body(new RegisterRequest("", "", "", ""))
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    @Test
    void login_validCredentials_setCookies() {
        String email = "logintest@example.com";
        RegisterRequest registerRequest = new RegisterRequest(email, "password123", "Login Test", "test-captcha-token");
        restTestClient
                .post()
                .uri("/api/auth/register")
                .body(registerRequest)
                .exchange()
                .expectStatus()
                .isCreated();

        // Unverified user — login should be rejected
        LoginRequest loginRequest = new LoginRequest(email, "password123");
        restTestClient
                .post()
                .uri("/api/auth/login")
                .body(loginRequest)
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void login_invalidCredentials_returnsUnauthorized() {
        LoginRequest loginRequest = new LoginRequest("nouser@example.com", "wrongpass");

        restTestClient
                .post()
                .uri("/api/auth/login")
                .body(loginRequest)
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void verifyEmail_invalidToken_returnsUnauthorized() {
        VerifyEmailRequest request = new VerifyEmailRequest("totally-invalid-token");

        restTestClient
                .post()
                .uri("/api/auth/verify-email")
                .body(request)
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void me_unauthenticated_returnsUnauthorized() {
        restTestClient.get().uri("/api/auth/me").exchange().expectStatus().isUnauthorized();
    }
}

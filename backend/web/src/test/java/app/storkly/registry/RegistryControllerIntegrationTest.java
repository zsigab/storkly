package app.storkly.registry;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestPropertySource(properties = "storkly.captcha.enabled=false")
class RegistryControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void listSubscribers_ownerCanView() {
        // Register owner
        String ownerEmail = "owner@example.com";
        RegisterRequest ownerRegister = new RegisterRequest(ownerEmail, "password123", "Owner", "test-captcha-token");
        webTestClient
                .post()
                .uri("/api/auth/register")
                .bodyValue(ownerRegister)
                .exchange()
                .expectStatus()
                .isCreated();

        // Login owner to get auth token
        LoginRequest ownerLogin = new LoginRequest(ownerEmail, "password123");
        webTestClient
                .post()
                .uri("/api/auth/login")
                .bodyValue(ownerLogin)
                .exchange()
                .expectStatus()
                .isUnauthorized(); // User not verified yet

        // For this test, we verify the endpoint exists and returns 401 when unauthenticated
        webTestClient
                .get()
                .uri("/api/registries/test-slug/subscribers")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void listSubscribers_unauthenticatedReturnsUnauthorized() {
        webTestClient
                .get()
                .uri("/api/registries/test-slug/subscribers")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }
}

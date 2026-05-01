package app.storkly.item;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestPropertySource(properties = "storkly.captcha.enabled=false")
class ClaimControllerIntegrationTest {

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
    void listClaims_unknownItem_returnsNotFound() {
        restTestClient
                .get()
                .uri("/api/items/00000000-0000-0000-0000-000000000001/claims")
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void unclaimById_unauthenticated_returnsForbidden() {
        // UUID value → controller tries auth; unauthenticated → AccessDeniedException → 403
        restTestClient
                .delete()
                .uri("/api/claims/00000000-0000-0000-0000-000000000001")
                .exchange()
                .expectStatus()
                .isForbidden();
    }

    @Test
    void unclaimByToken_invalidToken_returnsNotFound() {
        // Non-UUID value → controller treats as token; unknown token → ClaimNotFoundException → 404
        restTestClient
                .delete()
                .uri("/api/claims/totally-invalid-token")
                .exchange()
                .expectStatus()
                .isNotFound();
    }
}

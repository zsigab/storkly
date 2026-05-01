package app.storkly.category;

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
class CategoryControllerIntegrationTest {

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
    void listCategories_unknownRegistry_returnsNotFound() {
        restTestClient
                .get()
                .uri("/api/registries/nonexistent/categories")
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void createCategory_unauthenticated_returnsUnauthorized() {
        restTestClient
                .post()
                .uri("/api/registries/any-slug/categories")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void updateCategory_unauthenticated_returnsUnauthorized() {
        restTestClient
                .patch()
                .uri("/api/categories/00000000-0000-0000-0000-000000000001")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void deleteCategory_unauthenticated_returnsUnauthorized() {
        restTestClient
                .delete()
                .uri("/api/categories/00000000-0000-0000-0000-000000000001")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void reorderCategories_unauthenticated_returnsUnauthorized() {
        restTestClient
                .put()
                .uri("/api/registries/any-slug/categories/order")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }
}

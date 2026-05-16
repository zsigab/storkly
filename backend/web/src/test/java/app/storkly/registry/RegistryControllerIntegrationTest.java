package app.storkly.registry;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.registry.dto.RegistryCreateRequest;
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
class RegistryControllerIntegrationTest {

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
    void listSubscribers_unauthenticated_returnsUnauthorized() {
        restTestClient
                .get()
                .uri("/api/registries/test-slug/subscribers")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void createRegistry_unauthenticated_returnsUnauthorized() {
        restTestClient.post().uri("/api/registries").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void getRegistry_nonexistentSlug_returnsNotFound() {
        restTestClient
                .get()
                .uri("/api/registries/does-not-exist")
                .exchange()
                .expectStatus()
                .isNotFound();
    }

    @Test
    void getRegistry_seededPublicRegistry_returnsRegistry() {
        restTestClient
                .get()
                .uri("/api/registries/baby-shower")
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.slug")
                .isEqualTo("baby-shower");
    }

    @Test
    void createRegistry_authenticated_returnsCreated() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        RegistryCreateRequest request = new RegistryCreateRequest("My New Registry", null, RegistryVisibility.PUBLIC);

        restTestClient
                .post()
                .uri("/api/registries")
                .cookie("access_token", authCookie)
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody()
                .jsonPath("$.name")
                .isEqualTo("My New Registry")
                .jsonPath("$.visibility")
                .isEqualTo("PUBLIC");
    }

    @Test
    void createHiddenRegistry_andFetchAsGuest_returnsForbidden() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        RegistryCreateRequest request = new RegistryCreateRequest("Secret", null, RegistryVisibility.HIDDEN);
        AtomicReference<String> slugRef = new AtomicReference<>();

        restTestClient
                .post()
                .uri("/api/registries")
                .cookie("access_token", authCookie)
                .body(request)
                .exchange()
                .expectStatus()
                .isCreated()
                .expectBody()
                .jsonPath("$.slug")
                .value(slug -> slugRef.set((String) slug));

        restTestClient
                .get()
                .uri("/api/registries/" + slugRef.get())
                .exchange()
                .expectStatus()
                .isForbidden();
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

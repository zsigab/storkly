package app.storkly.linkpreview;

import app.storkly.auth.dto.LoginRequest;
import app.storkly.linkpreview.dto.LinkPreviewRequest;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpHeaders;
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
class LinkPreviewControllerIntegrationTest {

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
    void preview_unauthenticated_returnsUnauthorized() {
        restTestClient
                .post()
                .uri("/api/link-preview")
                .body("{\"url\":\"https://example.com\"}")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void preview_authenticated_withUnsupportedUrl_returns200WithUnsupportedResult() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        restTestClient
                .post()
                .uri("/api/link-preview")
                .cookie("access_token", authCookie)
                .body(new LinkPreviewRequest("https://unsupported-site.example.com/product/123"))
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.supported")
                .isEqualTo(false)
                .jsonPath("$.sourceSite")
                .isEqualTo("MANUAL")
                .jsonPath("$.url")
                .isEqualTo("https://unsupported-site.example.com/product/123");
    }

    @Test
    void preview_authenticated_withBlankUrl_returns422() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        restTestClient
                .post()
                .uri("/api/link-preview")
                .cookie("access_token", authCookie)
                .body(new LinkPreviewRequest(""))
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
    }

    private String loginAndGetCookie(String email, String password) {
        AtomicReference<String> cookieRef = new AtomicReference<>();

        restTestClient
                .post()
                .uri("/api/auth/login")
                .body(new LoginRequest(email, password))
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

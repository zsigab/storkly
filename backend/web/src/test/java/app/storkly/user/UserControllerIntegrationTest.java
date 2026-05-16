package app.storkly.user;

import app.storkly.auth.dto.LoginRequest;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
class UserControllerIntegrationTest {

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
    void updateDisplayName_unauthenticated_returnsUnauthorized() {
        restTestClient
                .patch()
                .uri("/api/users/me/display-name")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"displayName\":\"New Name\"}")
                .exchange()
                .expectStatus()
                .isUnauthorized();
    }

    @Test
    void updateDisplayName_blankDisplayName_returnsUnprocessableEntity() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        restTestClient
                .patch()
                .uri("/api/users/me/display-name")
                .cookie("access_token", authCookie)
                .body(new app.storkly.user.dto.DisplayNameUpdateRequest(""))
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT);
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

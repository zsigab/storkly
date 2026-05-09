package app.storkly.user;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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
@TestPropertySource(properties = "storkly.captcha.enabled=false")
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
        restTestClient
                .patch()
                .uri("/api/users/me/display-name")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"displayName\":\"\"}")
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }
}

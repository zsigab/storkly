package app.storkly.image;

import static org.assertj.core.api.Assertions.assertThat;

import app.storkly.auth.dto.LoginRequest;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.util.MultiValueMap;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
@TestPropertySource(
        properties = {
            "storkly.captcha.enabled=false",
            "storkly.seed-data=true",
            "storkly.images.upload-dir=${java.io.tmpdir}/storkly-test-uploads"
        })
class ImageControllerIntegrationTest {

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
    void upload_unauthenticated_returnsUnauthorized() {
        restTestClient.post().uri("/api/images").exchange().expectStatus().isUnauthorized();
    }

    @Test
    void upload_authenticated_withValidImage_returns200WithUrl() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        byte[] pngBytes = minimalPngBytes();

        String responseBody = restTestClient
                .post()
                .uri("/api/images")
                .cookie("access_token", authCookie)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(buildMultipart(pngBytes, "image/png", "test.png"))
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody(String.class)
                .returnResult()
                .getResponseBody();

        assertThat(responseBody).contains("/uploads/");
        assertThat(responseBody).contains(".png");
    }

    @Test
    void upload_authenticated_withInvalidContentType_returns422() {
        String authCookie = loginAndGetCookie("owner@example.com", "password");

        restTestClient
                .post()
                .uri("/api/images")
                .cookie("access_token", authCookie)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(buildMultipart("not an image".getBytes(), "text/plain", "file.txt"))
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
    }

    private MultiValueMap<String, HttpEntity<?>> buildMultipart(byte[] bytes, String contentType, String filename) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return filename;
                    }
                })
                .contentType(MediaType.parseMediaType(contentType));
        return builder.build();
    }

    private byte[] minimalPngBytes() {
        return new byte[] {
            (byte) 0x89,
            0x50,
            0x4E,
            0x47,
            0x0D,
            0x0A,
            0x1A,
            0x0A,
            0x00,
            0x00,
            0x00,
            0x0D,
            0x49,
            0x48,
            0x44,
            0x52,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x00,
            0x00,
            0x01,
            0x08,
            0x02,
            0x00,
            0x00,
            0x00,
            (byte) 0x90,
            0x77,
            0x53,
            (byte) 0xDE,
            0x00,
            0x00,
            0x00,
            0x0C,
            0x49,
            0x44,
            0x41,
            0x54,
            0x08,
            (byte) 0xD7,
            0x63,
            (byte) 0xF8,
            (byte) 0xCF,
            (byte) 0xC0,
            0x00,
            0x00,
            0x00,
            0x02,
            0x00,
            0x01,
            (byte) 0xE2,
            0x21,
            (byte) 0xBC,
            0x33,
            0x00,
            0x00,
            0x00,
            0x00,
            0x49,
            0x45,
            0x4E,
            0x44,
            (byte) 0xAE,
            0x42,
            0x60,
            (byte) 0x82
        };
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

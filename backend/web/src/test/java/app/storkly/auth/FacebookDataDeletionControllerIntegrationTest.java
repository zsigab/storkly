package app.storkly.auth;

import static org.assertj.core.api.Assertions.assertThat;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
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
@TestPropertySource(properties = {"storkly.captcha.enabled=false"})
class FacebookDataDeletionControllerIntegrationTest {

    // Must match storkly.facebook.app-secret in application-test.yml
    private static final String APP_SECRET = "test-facebook-app-secret";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @LocalServerPort
    int port;

    @Autowired
    UserRepository userRepository;

    RestTestClient restTestClient;

    @BeforeEach
    void setUp() {
        restTestClient = RestTestClient.bindToServer()
                .baseUrl("http://localhost:" + port)
                .build();
    }

    @Test
    void validRequest_unknownFacebookUser_returns200Idempotently() {
        String signedRequest = buildSignedRequest("fb-does-not-exist", APP_SECRET);

        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=" + signedRequest)
                .exchange()
                .expectStatus()
                .isOk()
                .expectBody()
                .jsonPath("$.confirmation_code")
                .isNotEmpty()
                .jsonPath("$.url")
                .isNotEmpty();
    }

    @Test
    void validRequest_facebookOnlyUser_deletesAccount() {
        User user = userRepository.save(User.builder()
                .email("fb-only-deletion@example.com")
                .displayName("FB Only")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build());
        userRepository.addOAuthProvider(user.id(), AuthProvider.FACEBOOK, "fb-sole-login");

        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=" + buildSignedRequest("fb-sole-login", APP_SECRET))
                .exchange()
                .expectStatus()
                .isOk();

        assertThat(userRepository.findById(user.id())).isEmpty();
    }

    @Test
    void validRequest_facebookPlusPassword_unlinksOnlyFacebook() {
        User user = userRepository.save(User.builder()
                .email("fb-with-pass@example.com")
                .passwordHash("argon2hash")
                .displayName("FB+Pass")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build());
        userRepository.addOAuthProvider(user.id(), AuthProvider.FACEBOOK, "fb-has-password");

        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=" + buildSignedRequest("fb-has-password", APP_SECRET))
                .exchange()
                .expectStatus()
                .isOk();

        assertThat(userRepository.findById(user.id())).isPresent();
        assertThat(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-has-password"))
                .isEmpty();
    }

    @Test
    void validRequest_facebookPlusGoogle_unlinksOnlyFacebook() {
        User user = userRepository.save(User.builder()
                .email("fb-with-google@example.com")
                .displayName("FB+Google")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build());
        userRepository.addOAuthProvider(user.id(), AuthProvider.FACEBOOK, "fb-has-google");
        userRepository.addOAuthProvider(user.id(), AuthProvider.GOOGLE, "google-sub-xyz");

        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=" + buildSignedRequest("fb-has-google", APP_SECRET))
                .exchange()
                .expectStatus()
                .isOk();

        assertThat(userRepository.findById(user.id())).isPresent();
        assertThat(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-has-google"))
                .isEmpty();
        assertThat(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-xyz"))
                .isPresent();
    }

    @Test
    void invalidSignature_returns401() {
        String signedRequest = buildSignedRequest("fb-123", "wrong-secret");

        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=" + signedRequest)
                .exchange()
                .expectStatus()
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void malformedSignedRequest_returns400() {
        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("signed_request=notvalid")
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    @Test
    void missingParameter_returns400() {
        restTestClient
                .post()
                .uri("/api/auth/facebook/data-deletion")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body("")
                .exchange()
                .expectStatus()
                .isBadRequest();
    }

    private String buildSignedRequest(String facebookUserId, String secret) {
        try {
            String payloadJson =
                    "{\"algorithm\":\"HMAC-SHA256\",\"issued_at\":1234567890,\"user_id\":\"" + facebookUserId + "\"}";
            String encodedPayload = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(payloadJson.getBytes(StandardCharsets.UTF_8));
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8));
            String encodedSig = Base64.getUrlEncoder().withoutPadding().encodeToString(sig);
            return encodedSig + "." + encodedPayload;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException(e);
        }
    }
}

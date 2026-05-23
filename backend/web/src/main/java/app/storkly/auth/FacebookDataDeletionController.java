package app.storkly.auth;

import app.storkly.service.auth.FacebookDataDeletionService;
import app.storkly.service.auth.FacebookDataDeletionService.DeletionOutcome;
import app.storkly.service.auth.FacebookProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/auth/facebook")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Facebook", description = "Facebook platform callbacks")
public class FacebookDataDeletionController {

    private final FacebookDataDeletionService deletionService;
    private final FacebookProperties facebookProperties;
    private final ObjectMapper objectMapper;

    @PostMapping(path = "/data-deletion", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @Operation(summary = "Facebook data deletion callback")
    public Map<String, String> handleDataDeletion(
            @RequestParam(name = "signed_request", required = false) String signedRequest) {
        if (signedRequest == null || signedRequest.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing signed_request parameter");
        }
        String facebookUserId = verifyAndExtract(signedRequest);
        DeletionOutcome outcome = deletionService.process(facebookUserId);
        return Map.of(
                "url", outcome.statusUrl(),
                "confirmation_code", outcome.confirmationCode());
    }

    private String verifyAndExtract(String signedRequest) {
        String[] parts = signedRequest.split("\\.", 2);
        if (parts.length != 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid signed_request format");
        }
        try {
            byte[] secret = facebookProperties.appSecret().getBytes(StandardCharsets.UTF_8);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] expectedSig = mac.doFinal(parts[1].getBytes(StandardCharsets.UTF_8));
            byte[] actualSig = Base64.getUrlDecoder().decode(parts[0]);
            if (!MessageDigest.isEqual(expectedSig, actualSig)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid signature");
            }
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            JsonNode payload = objectMapper.readTree(payloadBytes);
            String userId = payload.path("user_id").asText(null);
            if (userId == null || userId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing user_id in payload");
            }
            return userId;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("HMAC configuration error", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Signature verification unavailable");
        } catch (Exception e) {
            log.warn("Failed to process Facebook signed_request: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed signed_request");
        }
    }
}

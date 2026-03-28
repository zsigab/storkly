package app.storkly.domain.user;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface EmailVerificationRepository {
    void save(UUID userId, String token, OffsetDateTime expiresAt);

    // Marks the token as used. Validates it is not expired and not already used.
    // Throws InvalidTokenException on any failure.
    void consume(String token);
}

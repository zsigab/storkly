package app.storkly.domain.user;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface PasswordResetRepository {
    void save(UUID userId, String token, OffsetDateTime expiresAt);

    // Marks the token as used and returns the associated userId.
    // Validates it is not expired and not already used.
    // Throws InvalidTokenException on any failure.
    UUID consume(String token);
}

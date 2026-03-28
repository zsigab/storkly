package app.storkly.domain.item;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClaimRepository {
    Claim save(Claim claim);

    Optional<Claim> findById(UUID id);

    Optional<Claim> findByClaimToken(String token);

    List<Claim> findActiveByItemId(UUID itemId);

    void release(UUID id, OffsetDateTime releasedAt);
}

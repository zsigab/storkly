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

    List<Claim> findAllByItemId(UUID itemId);

    boolean existsActiveByItemId(UUID itemId);

    boolean existsActiveByUserAndRegistry(UUID userId, UUID registryId);

    List<Claim> findActiveByRegistryId(UUID registryId);

    List<MyClaimView> findActiveByUserId(UUID userId);

    void release(UUID id, OffsetDateTime releasedAt);

    void receive(UUID id, OffsetDateTime receivedAt);

    void confirm(UUID id, OffsetDateTime confirmedAt);
}

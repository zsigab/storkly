package app.storkly.domain.item;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public interface ClaimRepository {
    Claim save(Claim claim);

    Optional<Claim> findById(UUID id);

    Optional<Claim> findByClaimToken(String token);

    List<Claim> findActiveByItemId(UUID itemId);

    List<Claim> findAllByItemId(UUID itemId);

    boolean existsActiveByItemId(UUID itemId);

    boolean existsActiveByUserAndRegistry(UUID userId, UUID registryId);

    boolean existsByDeliveryOptionId(UUID deliveryOptionId);

    List<Claim> findActiveByRegistryId(UUID registryId);

    List<Claim> findAllByRegistryId(UUID registryId);

    List<MyClaimView> findActiveByUserId(UUID userId);

    void release(UUID id, OffsetDateTime releasedAt);

    void receive(UUID id, OffsetDateTime receivedAt);

    void confirm(UUID id, OffsetDateTime confirmedAt);

    void updateDeliveryOption(UUID id, @Nullable UUID deliveryOptionId, @Nullable String deliveryType);
}

package app.storkly.domain.item;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DeliveryOptionRepository {
    DeliveryOption save(DeliveryOption option);

    Optional<DeliveryOption> findById(UUID id);

    List<DeliveryOption> findByRegistryId(UUID registryId);

    void deleteById(UUID id);

    void deleteByRegistryId(UUID registryId);
}

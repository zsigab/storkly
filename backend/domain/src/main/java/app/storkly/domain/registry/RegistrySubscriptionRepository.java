package app.storkly.domain.registry;

import java.util.List;
import java.util.UUID;

public interface RegistrySubscriptionRepository {
    void save(UUID userId, UUID registryId);

    boolean exists(UUID userId, UUID registryId);

    void delete(UUID userId, UUID registryId);

    List<RegistrySubscriber> findByRegistryId(UUID registryId);
}

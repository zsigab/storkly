package app.storkly.domain.registry;

import java.util.List;
import java.util.UUID;

public interface RegistryCoOwnerRepository {
    void add(UUID registryId, UUID userId);

    void remove(UUID registryId, UUID userId);

    boolean isCoOwner(UUID registryId, UUID userId);

    List<UUID> findUserIdsByRegistryId(UUID registryId);
}

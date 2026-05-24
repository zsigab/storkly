package app.storkly.domain.registry;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistryRepository {
    Registry save(Registry registry);

    Optional<Registry> findById(UUID id);

    Optional<Registry> findBySlug(String slug);

    List<Registry> findByOwnerId(UUID ownerId);

    List<Registry> findBySubscriberId(UUID userId);

    List<Registry> findByIds(Collection<UUID> ids);

    boolean existsBySlug(String slug);

    void deleteById(UUID id);
}

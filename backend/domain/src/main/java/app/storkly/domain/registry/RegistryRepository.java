package app.storkly.domain.registry;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistryRepository {
    Registry save(Registry registry);

    Optional<Registry> findById(UUID id);

    Optional<Registry> findBySlug(String slug);

    List<Registry> findByOwnerId(UUID ownerId);

    boolean existsBySlug(String slug);

    void deleteById(UUID id);
}

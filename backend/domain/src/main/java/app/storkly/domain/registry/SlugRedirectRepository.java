package app.storkly.domain.registry;

import java.util.Optional;
import java.util.UUID;

public interface SlugRedirectRepository {
    void save(String oldSlug, UUID registryId);

    Optional<Registry> findRegistryByOldSlug(String oldSlug);
}

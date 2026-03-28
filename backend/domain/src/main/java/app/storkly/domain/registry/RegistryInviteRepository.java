package app.storkly.domain.registry;

import java.util.Optional;
import java.util.UUID;

public interface RegistryInviteRepository {
    RegistryInvite save(RegistryInvite invite);

    Optional<RegistryInvite> findByToken(String token);

    void deleteByRegistryId(UUID registryId);
}

package app.storkly.service.registry;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RegistryAccessService {

    private final RegistryCoOwnerRepository coOwnerRepository;
    private final RegistrySubscriptionRepository subscriptionRepository;

    public void assertReadAccess(Registry registry, @Nullable UUID currentUserId) {
        if (registry.visibility() == RegistryVisibility.HIDDEN) {
            if (currentUserId == null
                    || (!registry.ownerId().equals(currentUserId)
                            && !coOwnerRepository.isCoOwner(registry.id(), currentUserId))) {
                throw new AccessDeniedException("Registry is hidden");
            }
        } else if (registry.visibility() == RegistryVisibility.PRIVATE) {
            if (currentUserId == null) {
                throw new AccessDeniedException("Registry is private");
            }
            boolean hasAccess = registry.ownerId().equals(currentUserId)
                    || coOwnerRepository.isCoOwner(registry.id(), currentUserId)
                    || subscriptionRepository.exists(currentUserId, registry.id());
            if (!hasAccess) {
                throw new AccessDeniedException("Registry is private");
            }
        }
    }
}

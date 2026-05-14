package app.storkly.service.item;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.DeliveryOption;
import app.storkly.domain.item.DeliveryOptionRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryOptionService {

    private final DeliveryOptionRepository deliveryOptionRepository;
    private final RegistryRepository registryRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;

    public List<DeliveryOption> findByRegistry(UUID registryId) {
        return deliveryOptionRepository.findByRegistryId(registryId);
    }

    @Transactional
    public DeliveryOption save(DeliveryOption option, UUID currentUserId) {
        Registry registry = registryRepository
                .findById(option.registryId())
                .orElseThrow(() -> new RegistryNotFoundException(option.registryId().toString()));

        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can manage delivery options");
        }

        if ("CUSTOM".equals(option.type()) && (option.label() == null || option.label().isBlank())) {
            throw new IllegalArgumentException("Custom delivery options must have a label");
        }

        return deliveryOptionRepository.save(option);
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        DeliveryOption option = deliveryOptionRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery option not found"));
        Registry registry = registryRepository
                .findById(option.registryId())
                .orElseThrow(() -> new RegistryNotFoundException(option.registryId().toString()));

        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can delete delivery options");
        }

        deliveryOptionRepository.deleteById(id);
    }
}

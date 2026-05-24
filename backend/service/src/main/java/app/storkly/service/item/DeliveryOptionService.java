package app.storkly.service.item;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.DeliveryOptionHasClaimsException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.ClaimRepository;
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

    public static final String EVENT_TYPE = "EVENT";

    private final DeliveryOptionRepository deliveryOptionRepository;
    private final ClaimRepository claimRepository;
    private final RegistryRepository registryRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;
    private final EventRepository eventRepository;

    public List<DeliveryOption> findByRegistry(UUID registryId) {
        return deliveryOptionRepository.findByRegistryId(registryId);
    }

    public List<DeliveryOption> findBySlug(String slug) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        return deliveryOptionRepository.findByRegistryId(registry.id());
    }

    public UUID resolveRegistryId(String slug) {
        return registryRepository
                .findBySlug(slug)
                .orElseThrow(() -> new RegistryNotFoundException(slug))
                .id();
    }

    @Transactional
    public DeliveryOption save(DeliveryOption option, UUID currentUserId) {
        Registry registry = registryRepository
                .findById(option.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(option.registryId().toString()));

        boolean isOwnerOrCoOwner =
                registry.ownerId().equals(currentUserId) || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can manage delivery options");
        }

        DeliveryOption toSave = normalizeForType(option, currentUserId);

        if ("CUSTOM".equals(toSave.type())
                && (toSave.label() == null || toSave.label().isBlank())) {
            throw new IllegalArgumentException("Custom delivery options must have a label");
        }

        return deliveryOptionRepository.save(toSave);
    }

    /**
     * EVENT claim types derive their label and (read-only) instructions from the linked event; any other type never
     * carries an event reference.
     */
    private DeliveryOption normalizeForType(DeliveryOption option, UUID currentUserId) {
        if (!EVENT_TYPE.equals(option.type())) {
            if (option.eventId() == null) {
                return option;
            }
            return option.toBuilder().eventId(null).build();
        }

        if (option.eventId() == null) {
            throw new IllegalArgumentException("Event claim types must reference an event");
        }
        Event event = eventRepository
                .findById(option.eventId())
                .orElseThrow(() -> new EventNotFoundException(option.eventId()));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only link claim types to your own events");
        }
        return option.toBuilder()
                .label(event.title())
                .description("Handover at " + event.title())
                .build();
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        DeliveryOption option = deliveryOptionRepository
                .findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery option not found"));
        Registry registry = registryRepository
                .findById(option.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(option.registryId().toString()));

        boolean isOwnerOrCoOwner =
                registry.ownerId().equals(currentUserId) || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can delete delivery options");
        }

        if (claimRepository.existsByDeliveryOptionId(id)) {
            throw new DeliveryOptionHasClaimsException(id);
        }

        deliveryOptionRepository.deleteById(id);
    }
}

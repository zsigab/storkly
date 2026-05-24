package app.storkly.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.DeliveryOption;
import app.storkly.domain.item.DeliveryOptionRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.item.DeliveryOptionService;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DeliveryOptionServiceTest {

    @Mock
    private DeliveryOptionRepository deliveryOptionRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private RegistryRepository registryRepository;

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private EventRepository eventRepository;

    private DeliveryOptionService service;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new DeliveryOptionService(
                deliveryOptionRepository, claimRepository, registryRepository, coOwnerRepository, eventRepository);
    }

    @Test
    void save_eventType_derivesLabelAndDescriptionFromEvent() {
        UUID eventId = UUID.randomUUID();
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry()));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event(eventId, ownerId)));
        when(deliveryOptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DeliveryOption result = service.save(option("EVENT", "ignored label", eventId), ownerId);

        ArgumentCaptor<DeliveryOption> captor = ArgumentCaptor.forClass(DeliveryOption.class);
        verify(deliveryOptionRepository).save(captor.capture());
        DeliveryOption saved = captor.getValue();
        assertThat(saved.label()).isEqualTo("Baby Shower");
        assertThat(saved.description()).isEqualTo("Handover at Baby Shower");
        assertThat(saved.eventId()).isEqualTo(eventId);
        assertThat(result.label()).isEqualTo("Baby Shower");
    }

    @Test
    void save_eventType_missingEventId_throws() {
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry()));

        assertThatThrownBy(() -> service.save(option("EVENT", "label", null), ownerId))
                .isInstanceOf(IllegalArgumentException.class);

        verify(deliveryOptionRepository, never()).save(any());
    }

    @Test
    void save_eventType_unknownEvent_throwsEventNotFound() {
        UUID eventId = UUID.randomUUID();
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry()));
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.save(option("EVENT", "label", eventId), ownerId))
                .isInstanceOf(EventNotFoundException.class);

        verify(deliveryOptionRepository, never()).save(any());
    }

    @Test
    void save_eventType_eventOwnedByAnotherUser_throwsAccessDenied() {
        UUID eventId = UUID.randomUUID();
        UUID otherUser = UUID.randomUUID();
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry()));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event(eventId, otherUser)));

        assertThatThrownBy(() -> service.save(option("EVENT", "label", eventId), ownerId))
                .isInstanceOf(AccessDeniedException.class);

        verify(deliveryOptionRepository, never()).save(any());
    }

    @Test
    void save_nonEventType_clearsEventReference() {
        UUID strayEventId = UUID.randomUUID();
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry()));
        when(deliveryOptionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.save(option("IN_PERSON", "Give in person", strayEventId), ownerId);

        ArgumentCaptor<DeliveryOption> captor = ArgumentCaptor.forClass(DeliveryOption.class);
        verify(deliveryOptionRepository).save(captor.capture());
        assertThat(captor.getValue().eventId()).isNull();
        verify(eventRepository, never()).findById(any());
    }

    private DeliveryOption option(String type, String label, UUID eventId) {
        return DeliveryOption.builder()
                .registryId(registryId)
                .type(type)
                .label(label)
                .enabled(true)
                .sortOrder(0)
                .eventId(eventId)
                .build();
    }

    private Registry registry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug("test-registry")
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private Event event(UUID id, UUID eventOwnerId) {
        return Event.builder()
                .id(id)
                .ownerId(eventOwnerId)
                .title("Baby Shower")
                .eventDate(OffsetDateTime.now().plusDays(30))
                .rsvpToken("tok-" + id)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}

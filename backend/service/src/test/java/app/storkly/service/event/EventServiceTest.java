package app.storkly.service.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventNotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @InjectMocks
    private EventService eventService;

    @Test
    void create_returnsEventWithGeneratedToken() {
        UUID ownerId = UUID.randomUUID();
        String title = "Birthday Party";
        OffsetDateTime eventDate = OffsetDateTime.now().plusDays(1);
        String location = "Home";

        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event event = invocation.getArgument(0);
            return Event.builder()
                    .id(UUID.randomUUID())
                    .ownerId(event.ownerId())
                    .title(event.title())
                    .eventDate(event.eventDate())
                    .location(event.location())
                    .rsvpToken(event.rsvpToken())
                    .themeColor(event.themeColor())
                    .themeBackground(event.themeBackground())
                    .createdAt(event.createdAt())
                    .build();
        });

        Event result = eventService.create(title, eventDate, null, location, null, null, null, null, ownerId);

        assertThat(result).isNotNull();
        assertThat(result.id()).isNotNull();
        assertThat(result.ownerId()).isEqualTo(ownerId);
        assertThat(result.title()).isEqualTo(title);
        assertThat(result.eventDate()).isEqualTo(eventDate);
        assertThat(result.location()).isEqualTo(location);
        assertThat(result.rsvpToken()).isNotNull().isNotEmpty();
        assertThat(result.createdAt()).isNotNull();

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        Event saved = captor.getValue();
        assertThat(saved.ownerId()).isEqualTo(ownerId);
    }

    @Test
    void findByOwner_delegatesToRepository() {
        UUID ownerId = UUID.randomUUID();
        Event event1 = Event.builder()
                .id(UUID.randomUUID())
                .ownerId(ownerId)
                .title("Event 1")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token1")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();
        Event event2 = Event.builder()
                .id(UUID.randomUUID())
                .ownerId(ownerId)
                .title("Event 2")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token2")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findByOwnerId(ownerId)).thenReturn(List.of(event1, event2));

        List<Event> result = eventService.findByOwner(ownerId);

        assertThat(result).hasSize(2).containsExactly(event1, event2);
        verify(eventRepository).findByOwnerId(ownerId);
    }

    @Test
    void findById_ownerCanAccess() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        Event result = eventService.findById(eventId, ownerId);

        assertThat(result).isEqualTo(event);
    }

    @Test
    void findById_notFoundThrowsException() {
        UUID eventId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();

        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.findById(eventId, currentUserId))
                .isInstanceOf(EventNotFoundException.class)
                .hasMessageContaining(eventId.toString());
    }

    @Test
    void findById_nonOwnerThrowsAccessDenied() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.findById(eventId, currentUserId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("owner");
    }

    @Test
    void findPublicById_noOwnershipCheck() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        Event result = eventService.findPublicById(eventId);

        assertThat(result).isEqualTo(event);
    }

    @Test
    void update_ownerCanUpdate() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Event original = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("Old Title")
                .eventDate(OffsetDateTime.now())
                .location("Old Location")
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();
        String newTitle = "New Title";
        OffsetDateTime newDate = OffsetDateTime.now().plusDays(2);

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(original));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event event = invocation.getArgument(0);
            return Event.builder()
                    .id(event.id())
                    .ownerId(event.ownerId())
                    .title(event.title())
                    .eventDate(event.eventDate())
                    .location(event.location())
                    .rsvpToken(event.rsvpToken())
                    .themeColor(event.themeColor())
                    .themeBackground(event.themeBackground())
                    .createdAt(event.createdAt())
                    .build();
        });

        Event result = eventService.update(eventId, newTitle, newDate, null, null, null, null, null, null, ownerId);

        assertThat(result.title()).isEqualTo(newTitle);
        assertThat(result.eventDate()).isEqualTo(newDate);
        assertThat(result.location()).isEqualTo(original.location());
        verify(eventRepository).save(any(Event.class));
    }

    @Test
    void update_nonOwnerThrowsAccessDenied() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() ->
                        eventService.update(eventId, "New", null, null, null, null, null, null, null, currentUserId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("owner");
    }

    @Test
    void delete_ownerCanDelete() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        eventService.delete(eventId, ownerId);

        verify(eventRepository).deleteById(eventId);
    }

    @Test
    void delete_nonOwnerThrowsAccessDenied() {
        UUID eventId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UUID currentUserId = UUID.randomUUID();
        Event event = Event.builder()
                .id(eventId)
                .ownerId(ownerId)
                .title("My Event")
                .eventDate(OffsetDateTime.now())
                .rsvpToken("token")
                .themeColor("peach")
                .themeBackground("none")
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.delete(eventId, currentUserId))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("owner");
    }
}

package app.storkly.service.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.event.EventTimeSlotRepository;
import app.storkly.domain.event.Rsvp;
import app.storkly.domain.event.RsvpRepository;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.service.auth.TurnstileService;
import app.storkly.service.email.EmailService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RsvpServiceTest {

    @Mock
    private RsvpRepository rsvpRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventTimeSlotRepository slotRepository;

    @Mock
    private TurnstileService turnstileService;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private RsvpService rsvpService;

    @Test
    void submitRsvp_anonymousNewRsvp_emailSent() {
        String rsvpToken = "valid-token";
        String displayName = "John Doe";
        String email = "john@example.com";
        boolean attending = true;
        String captchaToken = "captcha-token";
        UUID eventId = UUID.randomUUID();

        Event event = Event.builder()
                .id(eventId)
                .ownerId(UUID.randomUUID())
                .title("Birthday Party")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken(rsvpToken)
                .createdAt(OffsetDateTime.now())
                .build();

        doNothing().when(turnstileService).assertValid(captchaToken);
        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(event));
        when(slotRepository.findByEventId(eventId)).thenReturn(List.of());
        when(rsvpRepository.findByEventIdAndEmail(eventId, email)).thenReturn(Optional.empty());
        when(rsvpRepository.upsert(any(Rsvp.class))).thenAnswer(invocation -> {
            Rsvp rsvp = invocation.getArgument(0);
            return Rsvp.builder()
                    .id(UUID.randomUUID())
                    .eventId(rsvp.eventId())
                    .userId(rsvp.userId())
                    .email(rsvp.email())
                    .displayName(rsvp.displayName())
                    .attending(rsvp.attending())
                    .confirmationToken(rsvp.confirmationToken())
                    .confirmedAt(rsvp.confirmedAt())
                    .createdAt(rsvp.createdAt())
                    .build();
        });

        Rsvp result = rsvpService.submitRsvp(rsvpToken, displayName, email, attending, captchaToken, null, null);

        assertThat(result).isNotNull();
        assertThat(result.id()).isNotNull();
        assertThat(result.confirmedAt()).isNull();
        assertThat(result.userId()).isNull();
        verify(turnstileService).assertValid(captchaToken);
        verify(emailService).sendRsvpConfirmation(eq(email), eq(displayName), eq("Birthday Party"), anyString());
    }

    @Test
    void submitRsvp_authenticatedNewRsvp_noEmailSent() {
        String rsvpToken = "valid-token";
        String displayName = "Jane Doe";
        String email = "jane@example.com";
        boolean attending = true;
        String captchaToken = "captcha-token";
        UUID eventId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Event event = Event.builder()
                .id(eventId)
                .ownerId(UUID.randomUUID())
                .title("Birthday Party")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken(rsvpToken)
                .createdAt(OffsetDateTime.now())
                .build();

        doNothing().when(turnstileService).assertValid(captchaToken);
        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(event));
        when(slotRepository.findByEventId(eventId)).thenReturn(List.of());
        when(rsvpRepository.findByEventIdAndEmail(eventId, email)).thenReturn(Optional.empty());
        when(rsvpRepository.upsert(any(Rsvp.class))).thenAnswer(invocation -> {
            Rsvp rsvp = invocation.getArgument(0);
            return Rsvp.builder()
                    .id(UUID.randomUUID())
                    .eventId(rsvp.eventId())
                    .userId(rsvp.userId())
                    .email(rsvp.email())
                    .displayName(rsvp.displayName())
                    .attending(rsvp.attending())
                    .confirmationToken(rsvp.confirmationToken())
                    .confirmedAt(rsvp.confirmedAt())
                    .createdAt(rsvp.createdAt())
                    .build();
        });

        Rsvp result = rsvpService.submitRsvp(rsvpToken, displayName, email, attending, captchaToken, userId, null);

        assertThat(result).isNotNull();
        assertThat(result.confirmedAt()).isNotNull();
        assertThat(result.userId()).isEqualTo(userId);
        verify(turnstileService).assertValid(captchaToken);
        verify(emailService, never()).sendRsvpConfirmation(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void submitRsvp_resubmitUnconfirmed_newTokenGenerated() {
        String rsvpToken = "valid-token";
        String displayName = "John Doe";
        String email = "john@example.com";
        boolean attending = false;
        String captchaToken = "captcha-token";
        UUID eventId = UUID.randomUUID();
        UUID rsvpId = UUID.randomUUID();

        Event event = Event.builder()
                .id(eventId)
                .ownerId(UUID.randomUUID())
                .title("Birthday Party")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken(rsvpToken)
                .createdAt(OffsetDateTime.now())
                .build();

        Rsvp existing = Rsvp.builder()
                .id(rsvpId)
                .eventId(eventId)
                .email(email)
                .displayName("Old Name")
                .attending(true)
                .confirmationToken("old-token")
                .confirmedAt(null)
                .createdAt(OffsetDateTime.now())
                .build();

        doNothing().when(turnstileService).assertValid(captchaToken);
        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(event));
        when(slotRepository.findByEventId(eventId)).thenReturn(List.of());
        when(rsvpRepository.findByEventIdAndEmail(eventId, email)).thenReturn(Optional.of(existing));
        when(rsvpRepository.upsert(any(Rsvp.class))).thenAnswer(invocation -> {
            Rsvp rsvp = invocation.getArgument(0);
            return Rsvp.builder()
                    .id(rsvpId)
                    .eventId(rsvp.eventId())
                    .userId(rsvp.userId())
                    .email(rsvp.email())
                    .displayName(rsvp.displayName())
                    .attending(rsvp.attending())
                    .confirmationToken(rsvp.confirmationToken())
                    .confirmedAt(rsvp.confirmedAt())
                    .createdAt(rsvp.createdAt())
                    .build();
        });

        Rsvp result = rsvpService.submitRsvp(rsvpToken, displayName, email, attending, captchaToken, null, null);

        assertThat(result.confirmationToken()).isNotEqualTo(existing.confirmationToken());
        assertThat(result.attending()).isEqualTo(attending);
        verify(emailService).sendRsvpConfirmation(eq(email), eq(displayName), eq("Birthday Party"), anyString());
    }

    @Test
    void submitRsvp_resubmitConfirmed_attendingUpdatedNoEmail() {
        String rsvpToken = "valid-token";
        String displayName = "John Doe";
        String email = "john@example.com";
        boolean attending = false;
        String captchaToken = "captcha-token";
        UUID eventId = UUID.randomUUID();
        UUID rsvpId = UUID.randomUUID();
        String oldToken = "old-token";

        Event event = Event.builder()
                .id(eventId)
                .ownerId(UUID.randomUUID())
                .title("Birthday Party")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken(rsvpToken)
                .createdAt(OffsetDateTime.now())
                .build();

        OffsetDateTime confirmedAt = OffsetDateTime.now().minusHours(1);
        Rsvp existing = Rsvp.builder()
                .id(rsvpId)
                .eventId(eventId)
                .email(email)
                .displayName("Old Name")
                .attending(true)
                .confirmationToken(oldToken)
                .confirmedAt(confirmedAt)
                .createdAt(OffsetDateTime.now())
                .build();

        doNothing().when(turnstileService).assertValid(captchaToken);
        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(event));
        when(slotRepository.findByEventId(eventId)).thenReturn(List.of());
        when(rsvpRepository.findByEventIdAndEmail(eventId, email)).thenReturn(Optional.of(existing));
        when(rsvpRepository.upsert(any(Rsvp.class))).thenAnswer(invocation -> {
            Rsvp rsvp = invocation.getArgument(0);
            return Rsvp.builder()
                    .id(rsvpId)
                    .eventId(rsvp.eventId())
                    .userId(rsvp.userId())
                    .email(rsvp.email())
                    .displayName(rsvp.displayName())
                    .attending(rsvp.attending())
                    .confirmationToken(oldToken)
                    .confirmedAt(confirmedAt)
                    .createdAt(rsvp.createdAt())
                    .build();
        });

        Rsvp result = rsvpService.submitRsvp(rsvpToken, displayName, email, attending, captchaToken, null, null);

        assertThat(result.confirmationToken()).isEqualTo(oldToken);
        assertThat(result.confirmedAt()).isEqualTo(confirmedAt);
        assertThat(result.attending()).isEqualTo(attending);
        verify(emailService, never()).sendRsvpConfirmation(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void submitRsvp_invalidRsvpToken_throwsInvalidToken() {
        String rsvpToken = "invalid-token";
        String captchaToken = "captcha-token";

        doNothing().when(turnstileService).assertValid(captchaToken);
        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                        rsvpService.submitRsvp(rsvpToken, "John", "john@example.com", true, captchaToken, null, null))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void submitRsvp_invalidCaptcha_throwsInvalidToken() {
        String rsvpToken = "valid-token";
        String captchaToken = "invalid-captcha";

        doThrow(new InvalidTokenException("CAPTCHA verification failed"))
                .when(turnstileService)
                .assertValid(captchaToken);

        assertThatThrownBy(() ->
                        rsvpService.submitRsvp(rsvpToken, "John", "john@example.com", true, captchaToken, null, null))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void confirmRsvp_validToken_setsConfirmedAtAndReturnsEventId() {
        String confirmToken = "confirm-token";
        UUID eventId = UUID.randomUUID();
        UUID rsvpId = UUID.randomUUID();

        Rsvp rsvp = Rsvp.builder()
                .id(rsvpId)
                .eventId(eventId)
                .email("john@example.com")
                .displayName("John")
                .attending(true)
                .confirmationToken(confirmToken)
                .confirmedAt(null)
                .createdAt(OffsetDateTime.now())
                .build();

        when(rsvpRepository.findByConfirmToken(confirmToken)).thenReturn(Optional.of(rsvp));
        when(rsvpRepository.confirm(eq(rsvpId), any(OffsetDateTime.class)))
                .thenReturn(Rsvp.builder()
                        .id(rsvpId)
                        .eventId(eventId)
                        .email("john@example.com")
                        .displayName("John")
                        .attending(true)
                        .confirmationToken(confirmToken)
                        .confirmedAt(OffsetDateTime.now())
                        .createdAt(rsvp.createdAt())
                        .build());

        UUID result = rsvpService.confirmRsvp(confirmToken);

        assertThat(result).isEqualTo(eventId);
        verify(rsvpRepository).confirm(eq(rsvpId), any(OffsetDateTime.class));
    }

    @Test
    void confirmRsvp_alreadyConfirmed_idempotent() {
        String confirmToken = "confirm-token";
        UUID eventId = UUID.randomUUID();
        UUID rsvpId = UUID.randomUUID();

        Rsvp rsvp = Rsvp.builder()
                .id(rsvpId)
                .eventId(eventId)
                .email("john@example.com")
                .displayName("John")
                .attending(true)
                .confirmationToken(confirmToken)
                .confirmedAt(OffsetDateTime.now().minusHours(1))
                .createdAt(OffsetDateTime.now())
                .build();

        when(rsvpRepository.findByConfirmToken(confirmToken)).thenReturn(Optional.of(rsvp));

        UUID result = rsvpService.confirmRsvp(confirmToken);

        assertThat(result).isEqualTo(eventId);
        verify(rsvpRepository, never()).confirm(any(), any());
    }

    @Test
    void confirmRsvp_invalidToken_throwsInvalidToken() {
        String confirmToken = "invalid-token";

        when(rsvpRepository.findByConfirmToken(confirmToken)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rsvpService.confirmRsvp(confirmToken)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void getEventByRsvpToken_validToken_returnsEvent() {
        String rsvpToken = "valid-rsvp-token";
        UUID eventId = UUID.randomUUID();

        Event event = Event.builder()
                .id(eventId)
                .ownerId(UUID.randomUUID())
                .title("Test Event")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken(rsvpToken)
                .createdAt(OffsetDateTime.now())
                .build();

        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.of(event));

        Event result = rsvpService.getEventByRsvpToken(rsvpToken);

        assertThat(result).isEqualTo(event);
    }

    @Test
    void getEventByRsvpToken_invalidToken_throwsInvalidToken() {
        String rsvpToken = "invalid-token";

        when(eventRepository.findByRsvpToken(rsvpToken)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rsvpService.getEventByRsvpToken(rsvpToken)).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void findAttendingEventsByUser_withAttendingRsvps_returnsEvents() {
        UUID userId = UUID.randomUUID();
        UUID eventId1 = UUID.randomUUID();
        UUID eventId2 = UUID.randomUUID();

        Event event1 = Event.builder()
                .id(eventId1)
                .ownerId(UUID.randomUUID())
                .title("Party A")
                .eventDate(OffsetDateTime.now().plusDays(1))
                .rsvpToken("token-a")
                .createdAt(OffsetDateTime.now())
                .build();
        Event event2 = Event.builder()
                .id(eventId2)
                .ownerId(UUID.randomUUID())
                .title("Party B")
                .eventDate(OffsetDateTime.now().plusDays(2))
                .rsvpToken("token-b")
                .createdAt(OffsetDateTime.now())
                .build();

        when(rsvpRepository.findConfirmedEventIdsByUserId(userId)).thenReturn(Set.of(eventId1, eventId2));
        when(eventRepository.findByIds(Set.of(eventId1, eventId2))).thenReturn(List.of(event1, event2));

        List<Event> result = rsvpService.findAttendingEventsByUser(userId);

        assertThat(result).containsExactlyInAnyOrder(event1, event2);
    }

    @Test
    void findAttendingEventsByUser_noRsvps_returnsEmpty() {
        UUID userId = UUID.randomUUID();
        when(rsvpRepository.findConfirmedEventIdsByUserId(userId)).thenReturn(Set.of());

        List<Event> result = rsvpService.findAttendingEventsByUser(userId);

        assertThat(result).isEmpty();
    }

    @Test
    void getAttendeesByEventId_returnsAttendees() {
        UUID eventId = UUID.randomUUID();
        Rsvp rsvp1 = Rsvp.builder()
                .id(UUID.randomUUID())
                .eventId(eventId)
                .email("attendee1@example.com")
                .displayName("Attendee 1")
                .attending(true)
                .confirmationToken("token1")
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();
        Rsvp rsvp2 = Rsvp.builder()
                .id(UUID.randomUUID())
                .eventId(eventId)
                .email("attendee2@example.com")
                .displayName("Attendee 2")
                .attending(false)
                .confirmationToken("token2")
                .confirmedAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();

        when(rsvpRepository.findByEventId(eventId)).thenReturn(java.util.List.of(rsvp1, rsvp2));

        java.util.List<Rsvp> result = rsvpService.getAttendeesByEventId(eventId);

        assertThat(result).containsExactly(rsvp1, rsvp2);
    }
}

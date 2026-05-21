package app.storkly.service.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.event.Rsvp;
import app.storkly.domain.event.RsvpRepository;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.service.auth.TurnstileService;
import app.storkly.service.email.EmailService;
import app.storkly.util.TokenUtil;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RsvpService {

    private final RsvpRepository rsvpRepository;
    private final EventRepository eventRepository;
    private final TurnstileService turnstileService;
    private final EmailService emailService;

    @Transactional
    public Rsvp submitRsvp(
            String rsvpToken,
            String displayName,
            String email,
            boolean attending,
            String captchaToken,
            @Nullable UUID userId) {
        // Verify CAPTCHA (always, even for authenticated users)
        turnstileService.assertValid(captchaToken);

        // Resolve event by RSVP token
        Event event = eventRepository
                .findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid RSVP token"));

        // Check if RSVP already exists
        Optional<Rsvp> existingRsvp = rsvpRepository.findByEventIdAndEmail(event.id(), email);
        boolean isNewRsvp = existingRsvp.isEmpty();
        boolean wasUnconfirmed = existingRsvp.isPresent() && existingRsvp.get().confirmedAt() == null;

        // Build RSVP
        String confirmationToken = TokenUtil.generate();
        OffsetDateTime confirmedAt = userId != null ? OffsetDateTime.now() : null;
        Rsvp rsvp = Rsvp.builder()
                .eventId(event.id())
                .userId(userId)
                .email(email)
                .displayName(displayName)
                .attending(attending)
                .confirmationToken(confirmationToken)
                .confirmedAt(confirmedAt)
                .createdAt(OffsetDateTime.now())
                .build();

        Rsvp saved = rsvpRepository.upsert(rsvp);

        // Send confirmation email if anonymous AND (new RSVP OR was previously unconfirmed)
        if (userId == null && (isNewRsvp || wasUnconfirmed)) {
            emailService.sendRsvpConfirmation(email, displayName, event.title(), confirmationToken);
        }

        return saved;
    }

    @Transactional
    public UUID confirmRsvp(String confirmToken) {
        Rsvp rsvp = rsvpRepository
                .findByConfirmToken(confirmToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired confirmation token"));

        // Idempotent: if already confirmed, just return the event ID
        if (rsvp.confirmedAt() != null) {
            return rsvp.eventId();
        }

        // Confirm the RSVP
        rsvpRepository.confirm(rsvp.id(), OffsetDateTime.now());
        return rsvp.eventId();
    }

    public Event getEventByRsvpToken(String rsvpToken) {
        return eventRepository
                .findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid RSVP token"));
    }

    public List<Rsvp> getAttendeesByEventId(UUID eventId) {
        return rsvpRepository.findByEventId(eventId);
    }
}

package app.storkly.service.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.event.EventTimeSlotRepository;
import app.storkly.domain.event.Rsvp;
import app.storkly.domain.event.RsvpRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventAtCapacityException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.exception.InvalidSlotException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.RsvpNotFoundException;
import app.storkly.domain.exception.SlotAtCapacityException;
import app.storkly.service.auth.TurnstileService;
import app.storkly.service.email.EmailService;
import app.storkly.util.TokenUtil;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    private final EventTimeSlotRepository slotRepository;
    private final TurnstileService turnstileService;
    private final EmailService emailService;

    @Transactional
    public Rsvp submitRsvp(
            String rsvpToken,
            String displayName,
            String email,
            boolean attending,
            String captchaToken,
            @Nullable UUID userId,
            @Nullable UUID timeSlotId) {
        // Verify CAPTCHA (always, even for authenticated users)
        turnstileService.assertValid(captchaToken);

        // Resolve event by RSVP token
        Event event = eventRepository
                .findByRsvpToken(rsvpToken)
                .orElseThrow(() -> new InvalidTokenException("Invalid RSVP token"));

        // Get all slots for this event
        List<EventTimeSlot> slots = slotRepository.findByEventId(event.id());

        // Validate slot selection when attending
        EventTimeSlot selectedSlot = null;
        if (attending && !slots.isEmpty()) {
            if (timeSlotId == null) {
                throw new InvalidSlotException("A time slot is required for this event");
            }
            selectedSlot = slots.stream()
                    .filter(s -> timeSlotId.equals(s.id()))
                    .findFirst()
                    .orElseThrow(() -> new InvalidSlotException("Invalid time slot for this event"));
        }

        // Check if RSVP already exists
        Optional<Rsvp> existingRsvp = rsvpRepository.findByEventIdAndEmail(event.id(), email);
        boolean isNewRsvp = existingRsvp.isEmpty();
        boolean wasUnconfirmed = existingRsvp.isPresent() && existingRsvp.get().confirmedAt() == null;
        UUID existingRsvpId = existingRsvp.map(Rsvp::id).orElse(null);

        // Capacity checks (only when attending)
        if (attending) {
            if (selectedSlot != null && selectedSlot.capacity() != null) {
                int used = rsvpRepository.countAttendingBySlotIdExcluding(timeSlotId, existingRsvpId);
                if (used >= selectedSlot.capacity()) {
                    throw new SlotAtCapacityException();
                }
            }
            if (event.rsvpCapacity() != null) {
                int used = rsvpRepository.countAttendingByEventIdExcluding(event.id(), existingRsvpId);
                if (used >= event.rsvpCapacity()) {
                    throw new EventAtCapacityException();
                }
            }
        }

        // Build RSVP
        String confirmationToken = TokenUtil.generate();
        OffsetDateTime confirmedAt = userId != null ? OffsetDateTime.now() : null;
        Rsvp rsvp = Rsvp.builder()
                .eventId(event.id())
                .userId(userId)
                .email(email)
                .displayName(displayName)
                .attending(attending)
                .timeSlotId(attending ? timeSlotId : null)
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

    public List<Event> findAttendingEventsByUser(UUID userId) {
        Set<UUID> eventIds = rsvpRepository.findConfirmedEventIdsByUserId(userId);
        if (eventIds.isEmpty()) return List.of();
        return eventRepository.findByIds(eventIds);
    }

    public int countAttendingByEventId(UUID eventId) {
        return rsvpRepository.countAttendingByEventIdExcluding(eventId, null);
    }

    public int countAttendingBySlot(UUID slotId) {
        return rsvpRepository.countAttendingBySlotIdExcluding(slotId, null);
    }

    @Transactional
    public void deleteRsvp(UUID rsvpId, UUID eventId, UUID ownerId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(ownerId)) {
            throw new AccessDeniedException("Only the event owner can delete RSVPs");
        }
        Rsvp rsvp = rsvpRepository.findById(rsvpId).orElseThrow(() -> new RsvpNotFoundException(rsvpId));
        if (!rsvp.eventId().equals(eventId)) {
            throw new RsvpNotFoundException(rsvpId);
        }
        rsvpRepository.deleteById(rsvpId);
    }
}

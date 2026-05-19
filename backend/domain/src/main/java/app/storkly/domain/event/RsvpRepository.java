package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RsvpRepository {
    Rsvp upsert(Rsvp rsvp);

    Optional<Rsvp> findByEventIdAndEmail(UUID eventId, String email);

    List<Rsvp> findByEventId(UUID eventId);

    Optional<Rsvp> findByConfirmToken(String token);

    Rsvp confirm(UUID id, OffsetDateTime confirmedAt);
}

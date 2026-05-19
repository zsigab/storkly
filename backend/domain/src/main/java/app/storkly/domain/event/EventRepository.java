package app.storkly.domain.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository {
    Event save(Event event);

    Optional<Event> findById(UUID id);

    Optional<Event> findByRsvpToken(String rsvpToken);

    List<Event> findByOwnerId(UUID ownerId);

    void deleteById(UUID id);
}

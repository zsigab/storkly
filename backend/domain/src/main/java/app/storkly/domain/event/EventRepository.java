package app.storkly.domain.event;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository {
    Event save(Event event);

    Optional<Event> findById(UUID id);

    Optional<Event> findByRsvpToken(String rsvpToken);

    Optional<Event> findByRsvpShortCode(String rsvpShortCode);

    List<Event> findByOwnerId(UUID ownerId);

    List<Event> findByIds(Collection<UUID> ids);

    void saveShortCode(UUID id, String shortCode);

    void deleteById(UUID id);
}

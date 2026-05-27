package app.storkly.domain.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventCustomSlugRepository {
    void save(String slug, UUID eventId);

    void delete(String slug);

    List<String> findSlugsByEventId(UUID eventId);

    Optional<Event> findEventBySlug(String slug);
}

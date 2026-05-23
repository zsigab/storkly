package app.storkly.domain.event;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventTimeSlotRepository {
    EventTimeSlot save(EventTimeSlot slot);

    Optional<EventTimeSlot> findById(UUID id);

    List<EventTimeSlot> findByEventId(UUID eventId);

    void deleteById(UUID id);
}

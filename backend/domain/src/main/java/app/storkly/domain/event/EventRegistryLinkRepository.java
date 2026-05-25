package app.storkly.domain.event;

import java.util.List;
import java.util.UUID;

public interface EventRegistryLinkRepository {
    void setLinks(UUID eventId, List<UUID> registryIds);

    List<UUID> findRegistryIdsByEventId(UUID eventId);

    boolean hasLinkedEvent(UUID registryId);
}

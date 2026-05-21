package app.storkly.domain.event;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface EventRegistryItemRepository {
    void saveLink(UUID eventId, UUID itemId);

    List<UUID> findEventIdsByItemId(UUID itemId);

    void deleteByItemId(UUID itemId);

    Map<UUID, List<UUID>> findAllByRegistryId(UUID registryId);
}

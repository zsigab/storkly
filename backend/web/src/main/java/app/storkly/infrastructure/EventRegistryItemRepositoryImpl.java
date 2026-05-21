package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT_REGISTRY_ITEM;
import static app.storkly.domain.generated.Tables.ITEM;

import app.storkly.domain.event.EventRegistryItemRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record2;
import org.jooq.Result;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EventRegistryItemRepositoryImpl implements EventRegistryItemRepository {

    private final DSLContext dsl;

    @Override
    public void saveLink(UUID eventId, UUID itemId) {
        dsl.insertInto(EVENT_REGISTRY_ITEM)
                .set(EVENT_REGISTRY_ITEM.EVENT_ID, eventId)
                .set(EVENT_REGISTRY_ITEM.ITEM_ID, itemId)
                .onConflictDoNothing()
                .execute();
    }

    @Override
    public List<UUID> findEventIdsByItemId(UUID itemId) {
        return dsl.select(EVENT_REGISTRY_ITEM.EVENT_ID)
                .from(EVENT_REGISTRY_ITEM)
                .where(EVENT_REGISTRY_ITEM.ITEM_ID.eq(itemId))
                .fetchInto(UUID.class);
    }

    @Override
    public void deleteByItemId(UUID itemId) {
        dsl.deleteFrom(EVENT_REGISTRY_ITEM)
                .where(EVENT_REGISTRY_ITEM.ITEM_ID.eq(itemId))
                .execute();
    }

    @Override
    public Map<UUID, List<UUID>> findAllByRegistryId(UUID registryId) {
        Result<Record2<UUID, UUID>> records = dsl.select(EVENT_REGISTRY_ITEM.ITEM_ID, EVENT_REGISTRY_ITEM.EVENT_ID)
                .from(EVENT_REGISTRY_ITEM)
                .join(ITEM)
                .on(ITEM.ID.eq(EVENT_REGISTRY_ITEM.ITEM_ID))
                .where(ITEM.REGISTRY_ID.eq(registryId))
                .fetch();

        Map<UUID, List<UUID>> result = new HashMap<>();
        for (Record2<UUID, UUID> record : records) {
            UUID itemId = record.value1();
            UUID eventId = record.value2();
            result.computeIfAbsent(itemId, k -> new ArrayList<>()).add(eventId);
        }
        return result;
    }
}

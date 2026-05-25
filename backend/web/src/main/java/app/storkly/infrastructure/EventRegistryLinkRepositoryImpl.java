package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT_REGISTRY_LINK;

import app.storkly.domain.event.EventRegistryLinkRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EventRegistryLinkRepositoryImpl implements EventRegistryLinkRepository {

    private final DSLContext dsl;

    @Override
    public void setLinks(UUID eventId, List<UUID> registryIds) {
        dsl.deleteFrom(EVENT_REGISTRY_LINK)
                .where(EVENT_REGISTRY_LINK.EVENT_ID.eq(eventId))
                .execute();

        if (!registryIds.isEmpty()) {
            registryIds.forEach(registryId -> dsl.insertInto(EVENT_REGISTRY_LINK)
                    .set(EVENT_REGISTRY_LINK.EVENT_ID, eventId)
                    .set(EVENT_REGISTRY_LINK.REGISTRY_ID, registryId)
                    .execute());
        }
    }

    @Override
    public List<UUID> findRegistryIdsByEventId(UUID eventId) {
        return dsl.select(EVENT_REGISTRY_LINK.REGISTRY_ID)
                .from(EVENT_REGISTRY_LINK)
                .where(EVENT_REGISTRY_LINK.EVENT_ID.eq(eventId))
                .fetch()
                .map(record -> record.value1());
    }

    @Override
    public boolean hasLinkedEvent(UUID registryId) {
        return dsl.fetchExists(
                dsl.selectOne().from(EVENT_REGISTRY_LINK).where(EVENT_REGISTRY_LINK.REGISTRY_ID.eq(registryId)));
    }
}

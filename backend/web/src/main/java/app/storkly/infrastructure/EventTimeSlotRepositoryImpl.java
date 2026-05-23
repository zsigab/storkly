package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT_TIME_SLOT;

import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.event.EventTimeSlotRepository;
import app.storkly.domain.generated.tables.records.EventTimeSlotRecord;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EventTimeSlotRepositoryImpl implements EventTimeSlotRepository {

    private final DSLContext dsl;

    @Override
    public EventTimeSlot save(EventTimeSlot slot) {
        if (slot.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(EVENT_TIME_SLOT)
                    .set(EVENT_TIME_SLOT.ID, id)
                    .set(EVENT_TIME_SLOT.EVENT_ID, slot.eventId())
                    .set(EVENT_TIME_SLOT.LABEL, slot.label())
                    .set(EVENT_TIME_SLOT.CAPACITY, slot.capacity())
                    .set(EVENT_TIME_SLOT.CREATED_AT, slot.createdAt())
                    .execute();
            return EventTimeSlot.builder()
                    .id(id)
                    .eventId(slot.eventId())
                    .label(slot.label())
                    .capacity(slot.capacity())
                    .createdAt(slot.createdAt())
                    .build();
        } else {
            dsl.update(EVENT_TIME_SLOT)
                    .set(EVENT_TIME_SLOT.LABEL, slot.label())
                    .set(EVENT_TIME_SLOT.CAPACITY, slot.capacity())
                    .where(EVENT_TIME_SLOT.ID.eq(slot.id()))
                    .execute();
            return slot;
        }
    }

    @Override
    public Optional<EventTimeSlot> findById(UUID id) {
        EventTimeSlotRecord record =
                dsl.selectFrom(EVENT_TIME_SLOT).where(EVENT_TIME_SLOT.ID.eq(id)).fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public List<EventTimeSlot> findByEventId(UUID eventId) {
        return dsl.selectFrom(EVENT_TIME_SLOT)
                .where(EVENT_TIME_SLOT.EVENT_ID.eq(eventId))
                .orderBy(EVENT_TIME_SLOT.CREATED_AT.asc())
                .fetch()
                .map(this::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(EVENT_TIME_SLOT).where(EVENT_TIME_SLOT.ID.eq(id)).execute();
    }

    private EventTimeSlot toDomain(EventTimeSlotRecord record) {
        return EventTimeSlot.builder()
                .id(record.getId())
                .eventId(record.getEventId())
                .label(record.getLabel())
                .capacity(record.getCapacity())
                .createdAt(record.getCreatedAt())
                .build();
    }
}

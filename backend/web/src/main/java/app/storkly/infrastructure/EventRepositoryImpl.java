package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.generated.tables.records.EventRecord;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EventRepositoryImpl implements EventRepository {

    private final DSLContext dsl;

    @Override
    public Event save(Event event) {
        if (event.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(EVENT)
                    .set(EVENT.ID, id)
                    .set(EVENT.OWNER_ID, event.ownerId())
                    .set(EVENT.TITLE, event.title())
                    .set(EVENT.EVENT_DATE, event.eventDate())
                    .set(EVENT.LOCATION, event.location())
                    .set(EVENT.RSVP_TOKEN, event.rsvpToken())
                    .set(EVENT.THEME_COLOR, event.themeColor())
                    .set(EVENT.THEME_BACKGROUND, event.themeBackground())
                    .set(EVENT.CREATED_AT, event.createdAt())
                    .execute();
            return Event.builder()
                    .id(id)
                    .ownerId(event.ownerId())
                    .title(event.title())
                    .eventDate(event.eventDate())
                    .location(event.location())
                    .rsvpToken(event.rsvpToken())
                    .themeColor(event.themeColor())
                    .themeBackground(event.themeBackground())
                    .createdAt(event.createdAt())
                    .build();
        } else {
            dsl.update(EVENT)
                    .set(EVENT.TITLE, event.title())
                    .set(EVENT.EVENT_DATE, event.eventDate())
                    .set(EVENT.LOCATION, event.location())
                    .set(EVENT.THEME_COLOR, event.themeColor())
                    .set(EVENT.THEME_BACKGROUND, event.themeBackground())
                    .where(EVENT.ID.eq(event.id()))
                    .execute();
            return event;
        }
    }

    @Override
    public Optional<Event> findById(UUID id) {
        EventRecord record = dsl.selectFrom(EVENT).where(EVENT.ID.eq(id)).fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public Optional<Event> findByRsvpToken(String rsvpToken) {
        EventRecord record =
                dsl.selectFrom(EVENT).where(EVENT.RSVP_TOKEN.eq(rsvpToken)).fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public List<Event> findByOwnerId(UUID ownerId) {
        return dsl.selectFrom(EVENT).where(EVENT.OWNER_ID.eq(ownerId)).fetch().map(this::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(EVENT).where(EVENT.ID.eq(id)).execute();
    }

    private Event toDomain(EventRecord record) {
        return Event.builder()
                .id(record.getId())
                .ownerId(record.getOwnerId())
                .title(record.getTitle())
                .eventDate(record.getEventDate())
                .location(record.getLocation())
                .rsvpToken(record.getRsvpToken())
                .themeColor(record.getThemeColor())
                .themeBackground(record.getThemeBackground())
                .createdAt(record.getCreatedAt())
                .build();
    }
}

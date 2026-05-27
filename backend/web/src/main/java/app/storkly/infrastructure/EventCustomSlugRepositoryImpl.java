package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT;
import static app.storkly.domain.generated.Tables.EVENT_CUSTOM_SLUG;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventCustomSlugRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EventCustomSlugRepositoryImpl implements EventCustomSlugRepository {

    private final DSLContext dsl;

    @Override
    public void save(String slug, UUID eventId) {
        dsl.insertInto(EVENT_CUSTOM_SLUG)
                .set(EVENT_CUSTOM_SLUG.SLUG, slug)
                .set(EVENT_CUSTOM_SLUG.EVENT_ID, eventId)
                .execute();
    }

    @Override
    public void delete(String slug) {
        dsl.deleteFrom(EVENT_CUSTOM_SLUG).where(EVENT_CUSTOM_SLUG.SLUG.eq(slug)).execute();
    }

    @Override
    public List<String> findSlugsByEventId(UUID eventId) {
        return dsl.select(EVENT_CUSTOM_SLUG.SLUG)
                .from(EVENT_CUSTOM_SLUG)
                .where(EVENT_CUSTOM_SLUG.EVENT_ID.eq(eventId))
                .fetch()
                .map(r -> r.getValue(EVENT_CUSTOM_SLUG.SLUG));
    }

    @Override
    public Optional<Event> findEventBySlug(String slug) {
        return dsl.select(EVENT.fields())
                .from(EVENT_CUSTOM_SLUG)
                .join(EVENT)
                .on(EVENT.ID.eq(EVENT_CUSTOM_SLUG.EVENT_ID))
                .where(EVENT_CUSTOM_SLUG.SLUG.eq(slug))
                .fetchOptional()
                .map(r -> toEvent(r.into(EVENT)));
    }

    private Event toEvent(app.storkly.domain.generated.tables.records.EventRecord r) {
        return Event.builder()
                .id(r.getId())
                .ownerId(r.getOwnerId())
                .title(r.getTitle())
                .eventDate(r.getEventDate())
                .eventDateOffsetSeconds(r.getEventDateOffsetSeconds())
                .location(r.getLocation())
                .description(r.getDescription())
                .rsvpToken(r.getRsvpToken())
                .rsvpShortCode(r.getRsvpShortCode())
                .rsvpCapacity(r.getRsvpCapacity())
                .themeColor(r.getThemeColor())
                .themeBackground(r.getThemeBackground())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

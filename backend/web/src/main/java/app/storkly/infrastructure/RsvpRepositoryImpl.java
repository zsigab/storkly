package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EVENT_REGISTRY_LINK;
import static app.storkly.domain.generated.Tables.RSVP;
import static app.storkly.domain.generated.Tables.USER;

import app.storkly.domain.event.Rsvp;
import app.storkly.domain.event.RsvpRepository;
import app.storkly.domain.generated.tables.records.RsvpRecord;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RsvpRepositoryImpl implements RsvpRepository {

    private final DSLContext dsl;

    @Override
    public Rsvp upsert(Rsvp rsvp) {
        // Check if RSVP already exists for this event + email
        Optional<RsvpRecord> existing =
                findByEventIdAndEmail(rsvp.eventId(), rsvp.email()).map(this::toRecord);

        if (existing.isEmpty()) {
            // Insert new RSVP
            UUID id = UUID.randomUUID();
            dsl.insertInto(RSVP)
                    .set(RSVP.ID, id)
                    .set(RSVP.EVENT_ID, rsvp.eventId())
                    .set(RSVP.USER_ID, rsvp.userId())
                    .set(RSVP.EMAIL, rsvp.email())
                    .set(RSVP.DISPLAY_NAME, rsvp.displayName())
                    .set(RSVP.ATTENDING, rsvp.attending())
                    .set(RSVP.TIME_SLOT_ID, rsvp.timeSlotId())
                    .set(RSVP.CONFIRMATION_TOKEN, rsvp.confirmationToken())
                    .set(RSVP.CONFIRMED_AT, rsvp.confirmedAt())
                    .set(RSVP.CREATED_AT, rsvp.createdAt())
                    .execute();
            return Rsvp.builder()
                    .id(id)
                    .eventId(rsvp.eventId())
                    .userId(rsvp.userId())
                    .email(rsvp.email())
                    .displayName(rsvp.displayName())
                    .attending(rsvp.attending())
                    .timeSlotId(rsvp.timeSlotId())
                    .confirmationToken(rsvp.confirmationToken())
                    .confirmedAt(rsvp.confirmedAt())
                    .createdAt(rsvp.createdAt())
                    .build();
        } else {
            // RSVP exists: check if already confirmed
            RsvpRecord existingRecord = existing.get();
            if (existingRecord.getConfirmedAt() == null) {
                // Not confirmed yet: reset token, update display name, attending, and slot
                dsl.update(RSVP)
                        .set(RSVP.DISPLAY_NAME, rsvp.displayName())
                        .set(RSVP.ATTENDING, rsvp.attending())
                        .set(RSVP.TIME_SLOT_ID, rsvp.timeSlotId())
                        .set(RSVP.CONFIRMATION_TOKEN, rsvp.confirmationToken())
                        .set(RSVP.USER_ID, rsvp.userId())
                        .where(RSVP.ID.eq(existingRecord.getId()))
                        .execute();
            } else {
                // Already confirmed: update attending and slot, keep token and confirmed_at
                dsl.update(RSVP)
                        .set(RSVP.ATTENDING, rsvp.attending())
                        .set(RSVP.TIME_SLOT_ID, rsvp.timeSlotId())
                        .where(RSVP.ID.eq(existingRecord.getId()))
                        .execute();
            }
            // Fetch and return the updated record
            return findByEventIdAndEmail(rsvp.eventId(), rsvp.email())
                    .orElseThrow(() -> new RuntimeException("RSVP disappeared after upsert"));
        }
    }

    @Override
    public Optional<Rsvp> findById(UUID id) {
        RsvpRecord record = dsl.selectFrom(RSVP).where(RSVP.ID.eq(id)).fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public Optional<Rsvp> findByEventIdAndEmail(UUID eventId, String email) {
        RsvpRecord record = dsl.selectFrom(RSVP)
                .where(RSVP.EVENT_ID.eq(eventId).and(RSVP.EMAIL.eq(email)))
                .fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public List<Rsvp> findByEventId(UUID eventId) {
        return dsl.select(
                        RSVP.ID,
                        RSVP.EVENT_ID,
                        RSVP.USER_ID,
                        RSVP.EMAIL,
                        DSL.coalesce(USER.DISPLAY_NAME, RSVP.DISPLAY_NAME).as("display_name"),
                        RSVP.ATTENDING,
                        RSVP.TIME_SLOT_ID,
                        RSVP.CONFIRMATION_TOKEN,
                        RSVP.CONFIRMED_AT,
                        RSVP.CREATED_AT)
                .from(RSVP)
                .leftJoin(USER)
                .on(RSVP.USER_ID.eq(USER.ID))
                .where(RSVP.EVENT_ID.eq(eventId))
                .fetch(r -> Rsvp.builder()
                        .id(r.get(RSVP.ID))
                        .eventId(r.get(RSVP.EVENT_ID))
                        .userId(r.get(RSVP.USER_ID))
                        .email(r.get(RSVP.EMAIL))
                        .displayName(r.get("display_name", String.class))
                        .attending(r.get(RSVP.ATTENDING))
                        .timeSlotId(r.get(RSVP.TIME_SLOT_ID))
                        .confirmationToken(r.get(RSVP.CONFIRMATION_TOKEN))
                        .confirmedAt(r.get(RSVP.CONFIRMED_AT))
                        .createdAt(r.get(RSVP.CREATED_AT))
                        .build());
    }

    @Override
    public Optional<Rsvp> findByConfirmToken(String token) {
        RsvpRecord record =
                dsl.selectFrom(RSVP).where(RSVP.CONFIRMATION_TOKEN.eq(token)).fetchOne();
        return Optional.ofNullable(record).map(this::toDomain);
    }

    @Override
    public Rsvp confirm(UUID id, OffsetDateTime confirmedAt) {
        dsl.update(RSVP)
                .set(RSVP.CONFIRMED_AT, confirmedAt)
                .where(RSVP.ID.eq(id))
                .execute();
        RsvpRecord record = dsl.selectFrom(RSVP).where(RSVP.ID.eq(id)).fetchOne();
        return Optional.ofNullable(record)
                .map(this::toDomain)
                .orElseThrow(() -> new RuntimeException("RSVP disappeared after confirm"));
    }

    @Override
    public int countAttendingByEventIdExcluding(UUID eventId, @Nullable UUID excludeRsvpId) {
        Condition condition = RSVP.EVENT_ID.eq(eventId).and(RSVP.ATTENDING.isTrue());
        if (excludeRsvpId != null) {
            condition = condition.and(RSVP.ID.ne(excludeRsvpId));
        }
        return dsl.fetchCount(RSVP, condition);
    }

    @Override
    public int countAttendingBySlotIdExcluding(UUID slotId, @Nullable UUID excludeRsvpId) {
        Condition condition = RSVP.TIME_SLOT_ID.eq(slotId).and(RSVP.ATTENDING.isTrue());
        if (excludeRsvpId != null) {
            condition = condition.and(RSVP.ID.ne(excludeRsvpId));
        }
        return dsl.fetchCount(RSVP, condition);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(RSVP).where(RSVP.ID.eq(id)).execute();
    }

    @Override
    public int claimGuestRsvps(String email, UUID userId) {
        return dsl.update(RSVP)
                .set(RSVP.USER_ID, userId)
                .set(RSVP.CONFIRMED_AT, DSL.coalesce(RSVP.CONFIRMED_AT, OffsetDateTime.now()))
                .where(RSVP.EMAIL.eq(email).and(RSVP.USER_ID.isNull()))
                .execute();
    }

    private Rsvp toDomain(RsvpRecord record) {
        return Rsvp.builder()
                .id(record.getId())
                .eventId(record.getEventId())
                .userId(record.getUserId())
                .email(record.getEmail())
                .displayName(record.getDisplayName())
                .attending(record.getAttending())
                .timeSlotId(record.getTimeSlotId())
                .confirmationToken(record.getConfirmationToken())
                .confirmedAt(record.getConfirmedAt())
                .createdAt(record.getCreatedAt())
                .build();
    }

    @Override
    public Set<UUID> findConfirmedEventIdsByUserId(UUID userId) {
        return dsl.select(RSVP.EVENT_ID)
                .from(RSVP)
                .where(RSVP.USER_ID
                        .eq(userId)
                        .and(RSVP.CONFIRMED_AT.isNotNull())
                        .and(RSVP.ATTENDING.isTrue()))
                .fetchSet(RSVP.EVENT_ID);
    }

    @Override
    public boolean userHasConfirmedRsvpForRegistry(UUID registryId, UUID userId) {
        return dsl.fetchExists(dsl.selectOne()
                .from(RSVP)
                .join(EVENT_REGISTRY_LINK)
                .on(RSVP.EVENT_ID.eq(EVENT_REGISTRY_LINK.EVENT_ID))
                .where(EVENT_REGISTRY_LINK
                        .REGISTRY_ID
                        .eq(registryId)
                        .and(RSVP.USER_ID.eq(userId))
                        .and(RSVP.ATTENDING.isTrue())
                        .and(RSVP.CONFIRMED_AT.isNotNull())));
    }

    private RsvpRecord toRecord(Rsvp rsvp) {
        RsvpRecord record = new RsvpRecord();
        record.setId(rsvp.id());
        record.setEventId(rsvp.eventId());
        record.setUserId(rsvp.userId());
        record.setEmail(rsvp.email());
        record.setDisplayName(rsvp.displayName());
        record.setAttending(rsvp.attending());
        record.setTimeSlotId(rsvp.timeSlotId());
        record.setConfirmationToken(rsvp.confirmationToken());
        record.setConfirmedAt(rsvp.confirmedAt());
        record.setCreatedAt(rsvp.createdAt());
        return record;
    }
}

package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.RSVP;

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
        return dsl.selectFrom(RSVP).where(RSVP.EVENT_ID.eq(eventId)).fetch().map(this::toDomain);
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

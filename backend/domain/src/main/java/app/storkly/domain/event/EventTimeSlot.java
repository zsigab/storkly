package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record EventTimeSlot(
        @Nullable UUID id,
        UUID eventId,
        OffsetDateTime slotTime,
        @Nullable Integer slotOffsetSeconds,
        @Nullable Integer capacity,
        OffsetDateTime createdAt) {}

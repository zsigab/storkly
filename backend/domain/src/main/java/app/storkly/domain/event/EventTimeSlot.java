package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record EventTimeSlot(
        @Nullable UUID id,
        UUID eventId,
        String label,
        @Nullable Integer capacity,
        OffsetDateTime createdAt) {}

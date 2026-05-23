package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record EventTimeSlotPublicResponse(
        UUID id,
        OffsetDateTime slotTime,
        @Nullable Integer slotOffsetSeconds,
        @Nullable Integer spotsLeft) {}

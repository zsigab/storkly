package app.storkly.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record EventTimeSlotCreateRequest(
        @NotNull OffsetDateTime slotTime,
        @Nullable Integer slotOffsetSeconds,
        @Nullable @Min(1) Integer capacity) {}

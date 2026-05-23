package app.storkly.event.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

public record EventTimeSlotCreateRequest(
        @NotBlank String label, @Nullable @Min(1) Integer capacity) {}

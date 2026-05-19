package app.storkly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record EventCreateRequest(
    @NotBlank String title,
    @NotNull OffsetDateTime eventDate,
    @Nullable String location) {}

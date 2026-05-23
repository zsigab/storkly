package app.storkly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record EventCreateRequest(
        @NotBlank String title,
        @NotNull OffsetDateTime eventDate,
        @Nullable String location,
        @Nullable String description,
        @Nullable @jakarta.validation.constraints.Min(1) Integer rsvpCapacity,
        @Nullable @Size(max = 16) String themeColor,
        @Nullable @Size(max = 16) String themeBackground) {}

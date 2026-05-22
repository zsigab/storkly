package app.storkly.event.dto;

import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record EventUpdateRequest(
        @Nullable String title,
        @Nullable OffsetDateTime eventDate,
        @Nullable String location,
        @Nullable @Size(max = 16) String themeColor,
        @Nullable @Size(max = 16) String themeBackground) {}

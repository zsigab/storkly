package app.storkly.event.dto;

import java.time.OffsetDateTime;
import org.jspecify.annotations.Nullable;

public record EventUpdateRequest(
        @Nullable String title,
        @Nullable OffsetDateTime eventDate,
        @Nullable String location) {}

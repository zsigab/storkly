package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Event(
        @Nullable UUID id,
        UUID ownerId,
        String title,
        OffsetDateTime eventDate,
        @Nullable Integer eventDateOffsetSeconds,
        @Nullable String location,
        @Nullable String description,
        String rsvpToken,
        @Nullable String rsvpShortCode,
        @Nullable Integer rsvpCapacity,
        String themeColor,
        String themeBackground,
        OffsetDateTime createdAt) {}

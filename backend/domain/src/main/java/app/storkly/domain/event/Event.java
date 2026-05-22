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
        @Nullable String location,
        String rsvpToken,
        String themeColor,
        String themeBackground,
        OffsetDateTime createdAt) {}

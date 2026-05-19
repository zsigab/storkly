package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Rsvp(
        @Nullable UUID id,
        UUID eventId,
        @Nullable UUID userId,
        String email,
        String displayName,
        boolean attending,
        String confirmationToken,
        @Nullable OffsetDateTime confirmedAt,
        OffsetDateTime createdAt) {}

package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RsvpResponse(
        UUID id,
        String displayName,
        String email,
        boolean attending,
        @Nullable OffsetDateTime confirmedAt,
        @Nullable String timeSlotLabel) {}

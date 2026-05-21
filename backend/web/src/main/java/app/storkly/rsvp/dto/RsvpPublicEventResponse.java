package app.storkly.rsvp.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RsvpPublicEventResponse(
        UUID eventId,
        String eventTitle,
        OffsetDateTime eventDate,
        @Nullable String location) {}

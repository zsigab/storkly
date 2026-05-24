package app.storkly.rsvp.dto;

import app.storkly.event.dto.EventTimeSlotPublicResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RsvpPublicEventResponse(
        UUID eventId,
        String eventTitle,
        OffsetDateTime eventDate,
        @Nullable Integer eventDateOffsetSeconds,
        @Nullable String location,
        @Nullable String description,
        String themeColor,
        String themeBackground,
        @Nullable Integer spotsLeft,
        List<EventTimeSlotPublicResponse> timeSlots) {}

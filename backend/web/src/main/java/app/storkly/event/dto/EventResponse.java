package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record EventResponse(
        UUID id,
        String title,
        OffsetDateTime eventDate,
        @Nullable Integer eventDateOffsetSeconds,
        @Nullable String location,
        @Nullable String description,
        String rsvpToken,
        @Nullable String rsvpShortCode,
        @Nullable Integer rsvpCapacity,
        List<RsvpResponse> attendees,
        List<EventTimeSlotResponse> timeSlots,
        String themeColor,
        String themeBackground,
        OffsetDateTime createdAt,
        List<LinkedRegistryResponse> linkedRegistries) {}

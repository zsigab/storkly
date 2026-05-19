package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record EventResponse(
    UUID id,
    String title,
    OffsetDateTime eventDate,
    String location,
    String rsvpToken,
    List<RsvpResponse> attendees,
    OffsetDateTime createdAt) {}

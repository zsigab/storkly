package app.storkly.event.dto;

import java.util.UUID;

public record EventSlugLookupResponse(UUID eventId, String rsvpToken) {}

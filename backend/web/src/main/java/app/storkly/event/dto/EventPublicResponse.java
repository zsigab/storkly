package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EventPublicResponse(
        UUID id, String title, OffsetDateTime eventDate, String location, String themeColor, String themeBackground) {}

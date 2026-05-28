package app.storkly.event.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record EventPublicResponse(
        UUID id,
        String title,
        OffsetDateTime eventDate,
        @Nullable Integer eventDateOffsetSeconds,
        String location,
        String description,
        String themeColor,
        String themeBackground,
        List<LinkedRegistryResponse> linkedRegistries) {}

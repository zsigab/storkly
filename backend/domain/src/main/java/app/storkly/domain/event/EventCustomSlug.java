package app.storkly.domain.event;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;

@Builder
public record EventCustomSlug(String slug, UUID eventId, OffsetDateTime createdAt) {}

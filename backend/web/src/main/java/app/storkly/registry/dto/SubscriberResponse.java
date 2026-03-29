package app.storkly.registry.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SubscriberResponse(UUID userId, String displayName, OffsetDateTime joinedAt) {}

package app.storkly.domain.registry;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RegistrySubscriber(UUID userId, String displayName, OffsetDateTime joinedAt) {}

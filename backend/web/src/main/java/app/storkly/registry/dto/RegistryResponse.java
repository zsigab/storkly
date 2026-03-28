package app.storkly.registry.dto;

import app.storkly.domain.registry.RegistryVisibility;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RegistryResponse(
        UUID id,
        String name,
        String slug,
        @Nullable String description,
        RegistryVisibility visibility,
        UUID ownerId,
        OffsetDateTime createdAt) {}

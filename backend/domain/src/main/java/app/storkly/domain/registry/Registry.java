package app.storkly.domain.registry;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Registry(
        @Nullable UUID id,
        UUID ownerId,
        String name,
        String slug,
        @Nullable String description,
        RegistryVisibility visibility,
        OffsetDateTime createdAt) {}

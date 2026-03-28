package app.storkly.domain.registry;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record RegistryInvite(
        @Nullable UUID id,
        UUID registryId,
        String token,
        OffsetDateTime createdAt,
        @Nullable OffsetDateTime usedAt) {}

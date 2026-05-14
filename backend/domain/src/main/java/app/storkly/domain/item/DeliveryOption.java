package app.storkly.domain.item;

import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record DeliveryOption(
        @Nullable UUID id,
        UUID registryId,
        String type,
        String label,
        @Nullable String description,
        boolean enabled,
        int sortOrder) {}

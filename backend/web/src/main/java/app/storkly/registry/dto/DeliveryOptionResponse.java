package app.storkly.registry.dto;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record DeliveryOptionResponse(
        UUID id,
        UUID registryId,
        String type,
        String label,
        @Nullable String description,
        boolean enabled,
        int sortOrder,
        @Nullable UUID eventId) {}

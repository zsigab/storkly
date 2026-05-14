package app.storkly.registry.dto;

import jakarta.validation.constraints.NotBlank;
import org.jspecify.annotations.Nullable;

public record DeliveryOptionRequest(
        @NotBlank String type,
        @NotBlank String label,
        @Nullable String description,
        boolean enabled,
        int sortOrder) {}

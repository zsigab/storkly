package app.storkly.registry.dto;

import app.storkly.domain.registry.RegistryVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.jspecify.annotations.Nullable;

public record RegistryCreateRequest(
        @NotBlank String name,
        @Nullable String description,
        @NotNull RegistryVisibility visibility) {}

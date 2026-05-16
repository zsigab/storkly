package app.storkly.registry.dto;

import app.storkly.domain.registry.RegistryVisibility;
import jakarta.validation.constraints.Size;
import org.jspecify.annotations.Nullable;

public record RegistryUpdateRequest(
        @Nullable @Size(max = 64) String name,
        @Nullable String description,
        @Nullable RegistryVisibility visibility) {}

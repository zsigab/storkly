package app.storkly.registry.dto;

import app.storkly.domain.registry.RegistryVisibility;
import org.jspecify.annotations.Nullable;

public record RegistryUpdateRequest(
        @Nullable String name,
        @Nullable String description,
        @Nullable RegistryVisibility visibility) {}

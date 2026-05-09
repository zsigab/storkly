package app.storkly.category.dto;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record CategoryResponse(UUID id, @Nullable UUID registryId, String name, int sortOrder, boolean isDefault, boolean isSystem) {}

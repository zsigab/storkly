package app.storkly.category.dto;

import java.util.UUID;

public record CategoryResponse(UUID id, UUID registryId, String name, int sortOrder, boolean isDefault) {}

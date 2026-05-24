package app.storkly.event.dto;

import java.util.UUID;

public record LinkedRegistryResponse(UUID id, String name, String slug) {}

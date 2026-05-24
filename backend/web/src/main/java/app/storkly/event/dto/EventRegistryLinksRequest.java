package app.storkly.event.dto;

import java.util.List;
import java.util.UUID;

public record EventRegistryLinksRequest(List<UUID> registryIds) {}

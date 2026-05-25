package app.storkly.registry.dto;

import app.storkly.domain.registry.ContributorAccess;
import app.storkly.domain.registry.RegistryVisibility;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RegistryResponse(
        UUID id,
        String name,
        String slug,
        @Nullable String description,
        RegistryVisibility visibility,
        ContributorAccess contributorAccess,
        UUID ownerId,
        String themeColor,
        String themeBackground,
        OffsetDateTime createdAt,
        boolean hasLinkedEvent,
        @Nullable Boolean userRsvpedYes) {}

package app.storkly.item.dto;

import app.storkly.domain.item.ItemFlag;
import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record ItemResponse(
        UUID id,
        UUID registryId,
        @Nullable UUID categoryId,
        @Nullable UUID addedByUserId,
        @Nullable String urlOriginal,
        SourceSite sourceSite,
        String title,
        @Nullable String description,
        @Nullable String imageUrl,
        @Nullable BigDecimal priceReference,
        @Nullable String currency,
        @Nullable OffsetDateTime priceCapturedAt,
        int quantityDesired,
        ItemFlag flag,
        @Nullable String notes,
        int sortOrder,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {}

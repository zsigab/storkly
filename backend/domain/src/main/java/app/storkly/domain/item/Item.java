package app.storkly.domain.item;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Item(
        @Nullable UUID id,
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

package app.storkly.item.dto;

import app.storkly.domain.item.ItemFlag;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record ItemUpdateRequest(
        @Nullable String title,
        @Nullable String description,
        @Nullable String urlOriginal,
        @Nullable String imageUrl,
        @Nullable BigDecimal priceReference,
        @Nullable String currency,
        @Nullable UUID categoryId,
        @Nullable ItemFlag flag,
        @Nullable @Min(1) Integer quantityDesired,
        @Nullable String notes,
        @Nullable Integer sortOrder) {}

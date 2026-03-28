package app.storkly.item.dto;

import app.storkly.domain.item.ItemFlag;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record ItemCreateRequest(
        @NotBlank String title,
        @Nullable String description,
        @Nullable String urlOriginal,
        @Nullable String imageUrl,
        @Nullable BigDecimal priceReference,
        @Nullable String currency,
        @Nullable UUID categoryId,
        @NotNull ItemFlag flag,
        @Min(1) int quantityDesired,
        @Nullable String notes) {}

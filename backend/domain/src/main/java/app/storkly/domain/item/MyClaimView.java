package app.storkly.domain.item;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record MyClaimView(
        UUID claimId,
        UUID itemId,
        String itemTitle,
        UUID registryId,
        String registryName,
        String registrySlug,
        int quantityClaimed,
        @Nullable BigDecimal amountContributed,
        @Nullable Integer percentageContributed,
        @Nullable UUID deliveryOptionId,
        @Nullable String deliveryType,
        OffsetDateTime claimedAt,
        @Nullable OffsetDateTime receivedAt) {}

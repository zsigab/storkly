package app.storkly.item.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record MyClaimResponse(
        UUID claimId,
        UUID itemId,
        String itemTitle,
        String registryName,
        String registrySlug,
        int quantityClaimed,
        @Nullable BigDecimal amountContributed,
        @Nullable Integer percentageContributed,
        @Nullable String deliveryType,
        OffsetDateTime claimedAt,
        @Nullable OffsetDateTime receivedAt) {}

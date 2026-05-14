package app.storkly.item.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record ClaimResponse(
        UUID id,
        UUID itemId,
        @Nullable UUID claimerUserId,
        @Nullable String claimerName,
        @Nullable String claimerEmail,
        int quantityClaimed,
        @Nullable BigDecimal amountContributed,
        @Nullable Integer percentageContributed,
        OffsetDateTime claimedAt,
        @Nullable OffsetDateTime confirmedAt,
        @Nullable String deliveryType,
        @Nullable OffsetDateTime receivedAt,
        @Nullable BigDecimal amountReceived,
        @Nullable OffsetDateTime releasedAt) {}

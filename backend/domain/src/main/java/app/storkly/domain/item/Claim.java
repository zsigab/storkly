package app.storkly.domain.item;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record Claim(
        @Nullable UUID id,
        UUID itemId,
        @Nullable UUID claimerUserId,
        String claimerName,
        String claimerEmail,
        int quantityClaimed,
        @Nullable BigDecimal amountContributed,
        @Nullable Integer percentageContributed,
        String claimToken,
        OffsetDateTime claimedAt,
        @Nullable OffsetDateTime releasedAt,
        @Nullable UUID deliveryOptionId,
        @Nullable String deliveryType,
        @Nullable OffsetDateTime receivedAt,
        @Nullable BigDecimal amountReceived,
        @Nullable OffsetDateTime confirmedAt) {}

package app.storkly.domain.item;

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
        String claimToken,
        OffsetDateTime claimedAt,
        @Nullable OffsetDateTime releasedAt) {}

package app.storkly.item.dto;

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
        OffsetDateTime claimedAt) {}

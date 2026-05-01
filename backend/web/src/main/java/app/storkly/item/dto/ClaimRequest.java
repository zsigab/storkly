package app.storkly.item.dto;

import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import org.jspecify.annotations.Nullable;

public record ClaimRequest(
        @Nullable String claimerName,
        @Nullable String claimerEmail,
        @Min(1) int quantityClaimed,
        @Nullable BigDecimal amountContributed,
        @Nullable Integer percentageContributed) {}

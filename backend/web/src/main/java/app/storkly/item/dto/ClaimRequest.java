package app.storkly.item.dto;

import jakarta.validation.constraints.Min;
import org.jspecify.annotations.Nullable;

public record ClaimRequest(
        @Nullable String claimerName,
        @Nullable String claimerEmail,
        @Min(1) int quantityClaimed) {}

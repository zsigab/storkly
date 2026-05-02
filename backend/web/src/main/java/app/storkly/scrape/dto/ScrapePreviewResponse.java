package app.storkly.scrape.dto;

import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import org.jspecify.annotations.Nullable;

public record ScrapePreviewResponse(
        String url,
        boolean supported,
        SourceSite sourceSite,
        @Nullable String title,
        @Nullable String description,
        @Nullable String imageUrl,
        @Nullable BigDecimal priceReference,
        @Nullable String currency) {}

package app.storkly.scraper;

import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

@Builder
public record ScrapeResult(
        String url,
        boolean supported,
        SourceSite sourceSite,
        @Nullable String title,
        @Nullable String description,
        @Nullable String imageUrl,
        @Nullable BigDecimal priceReference,
        @Nullable String currency) {

    public static ScrapeResult unsupported(String url) {
        return ScrapeResult.builder()
                .url(url)
                .supported(false)
                .sourceSite(SourceSite.MANUAL)
                .build();
    }
}

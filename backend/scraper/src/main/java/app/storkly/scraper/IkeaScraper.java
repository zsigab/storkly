package app.storkly.scraper;

import org.jspecify.annotations.Nullable;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(50)
public class IkeaScraper extends OgLinkPreviewScraper {

    @Override
    public boolean supports(@Nullable String url) {
        return url != null && url.contains("ikea.com");
    }

    @Override
    protected String userAgent() {
        return "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    }
}

package app.storkly.scraper;

import java.net.URI;
import java.net.URISyntaxException;
import org.jspecify.annotations.Nullable;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(50)
public class IkeaScraper extends OgLinkPreviewScraper {

    @Override
    public boolean supports(@Nullable String url) {
        if (url == null) {
            return false;
        }
        try {
            URI uri = new URI(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (host == null || scheme == null) {
                return false;
            }
            if (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https")) {
                return false;
            }
            String lowerHost = host.toLowerCase();
            return lowerHost.equals("ikea.com") || lowerHost.endsWith(".ikea.com");
        } catch (URISyntaxException e) {
            return false;
        }
    }

    @Override
    protected String userAgent() {
        return "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    }
}

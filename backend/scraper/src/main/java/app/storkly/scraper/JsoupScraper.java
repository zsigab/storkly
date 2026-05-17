package app.storkly.scraper;

import java.io.IOException;
import java.net.URI;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Connection;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

@Slf4j
public abstract class JsoupScraper implements Scraper {

    private static final int TIMEOUT_MS = 5_000;
    private static final int MAX_BODY_BYTES = 2_000_000; // 2 MB
    private static final int MAX_REDIRECTS = 3;

    protected String userAgent() {
        return "facebookexternalhit/1.1";
    }

    @Override
    public final ScrapeResult scrape(String url) {
        log.debug("Fetching url={}", url);
        Document doc = fetchWithSsrfGuard(url);
        return extract(doc, url);
    }

    private Document fetchWithSsrfGuard(String originalUrl) {
        String currentUrl = originalUrl;
        for (int hop = 0; hop <= MAX_REDIRECTS; hop++) {
            try {
                SsrfGuard.check(currentUrl);
            } catch (SsrfGuard.BlockedUrlException e) {
                log.warn(
                        "Blocked URL during fetch (hop={}) original={} target={}: {}",
                        hop,
                        originalUrl,
                        currentUrl,
                        e.getMessage());
                throw new ScrapingException(originalUrl, "Disallowed target URL");
            }
            try {
                Connection.Response response = Jsoup.connect(currentUrl)
                        .userAgent(userAgent())
                        .header("Accept-Language", "en-US,en;q=0.9")
                        .timeout(TIMEOUT_MS)
                        .maxBodySize(MAX_BODY_BYTES)
                        .followRedirects(false)
                        .ignoreHttpErrors(true)
                        .execute();
                int status = response.statusCode();
                if (status >= 300 && status < 400) {
                    String location = response.header("Location");
                    if (location == null || location.isBlank()) {
                        throw new ScrapingException(originalUrl, "Redirect missing Location header");
                    }
                    currentUrl = resolveRedirect(currentUrl, location);
                    continue;
                }
                if (status >= 400) {
                    throw new ScrapingException(originalUrl, "HTTP " + status);
                }
                return response.parse();
            } catch (IOException e) {
                log.warn("Fetch failed for original={} target={}: {}", originalUrl, currentUrl, e.getMessage());
                throw new ScrapingException(originalUrl, "Failed to fetch page", e);
            }
        }
        throw new ScrapingException(originalUrl, "Too many redirects");
    }

    private static String resolveRedirect(String from, String location) {
        try {
            return URI.create(from).resolve(location).toString();
        } catch (IllegalArgumentException e) {
            throw new ScrapingException(from, "Invalid redirect target");
        }
    }

    protected abstract ScrapeResult extract(Document doc, String url);
}

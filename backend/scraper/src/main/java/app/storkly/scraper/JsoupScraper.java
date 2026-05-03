package app.storkly.scraper;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

@Slf4j
public abstract class JsoupScraper implements Scraper {

    private static final String USER_AGENT = "facebookexternalhit/1.1";
    private static final int TIMEOUT_MS = 5_000;

    @Override
    public final ScrapeResult scrape(String url) {
        log.debug("Fetching url={}", url);
        Document doc;
        try {
            doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .timeout(TIMEOUT_MS)
                    .get();
        } catch (IOException e) {
            throw new ScrapingException(url, "Failed to fetch page: " + e.getMessage(), e);
        }
        return extract(doc, url);
    }

    protected abstract ScrapeResult extract(Document doc, String url);
}

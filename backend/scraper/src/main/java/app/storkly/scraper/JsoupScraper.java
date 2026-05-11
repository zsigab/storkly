package app.storkly.scraper;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

@Slf4j
public abstract class JsoupScraper implements Scraper {

    private static final int TIMEOUT_MS = 5_000;

    protected String userAgent() {
        return "facebookexternalhit/1.1";
    }

    @Override
    public final ScrapeResult scrape(String url) {
        log.debug("Fetching url={}", url);
        Document doc;
        try {
            doc = Jsoup.connect(url)
                    .userAgent(userAgent())
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

package app.storkly.scraper;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

@Slf4j
public abstract class JsoupScraper implements Scraper {

    private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            + "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    private static final int TIMEOUT_MS = 10_000;

    @Override
    public final ScrapeResult scrape(String url) {
        log.debug("Scraping url={}", url);
        Document doc;
        try {
            doc = Jsoup.connect(url).userAgent(USER_AGENT).timeout(TIMEOUT_MS).get();
        } catch (IOException e) {
            throw new ScrapingException(url, "Failed to fetch page: " + e.getMessage(), e);
        }
        return extract(doc, url);
    }

    protected abstract ScrapeResult extract(Document doc, String url);
}

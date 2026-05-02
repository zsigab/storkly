package app.storkly.scraper;

import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.PlaywrightException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
public abstract class PlaywrightScraper implements Scraper {

    private final com.microsoft.playwright.Browser browser;
    private static final int TIMEOUT_MS = 15_000;

    @Override
    public final ScrapeResult scrape(String url) {
        log.debug("Scraping url={}", url);
        try (BrowserContext context = browser.newContext();
                Page page = context.newPage()) {
            page.navigate(url, new Page.NavigateOptions().setTimeout(TIMEOUT_MS));
            return extract(page, url);
        } catch (PlaywrightException e) {
            throw new ScrapingException(url, "Failed to fetch page: " + e.getMessage(), e);
        }
    }

    protected abstract ScrapeResult extract(Page page, String url);
}

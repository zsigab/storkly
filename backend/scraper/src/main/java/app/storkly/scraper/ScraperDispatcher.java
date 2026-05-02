package app.storkly.scraper;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScraperDispatcher {

    private final List<Scraper> scrapers;

    public ScrapeResult preview(String url) {
        for (Scraper scraper : scrapers) {
            if (scraper.supports(url)) {
                log.info(
                        "Scraping url={} with scraper={}",
                        url,
                        scraper.getClass().getSimpleName());
                try {
                    return scraper.scrape(url);
                } catch (ScrapingException e) {
                    throw e;
                } catch (Exception e) {
                    throw new ScrapingException(url, "Unexpected error while scraping: " + e.getMessage(), e);
                }
            }
        }
        log.debug("No scraper supports url={}, returning unsupported result", url);
        return ScrapeResult.unsupported(url);
    }
}

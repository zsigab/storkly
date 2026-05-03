package app.storkly.scraper;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class LinkPreviewService {

    private final List<Scraper> scrapers;

    @Cacheable(value = "linkPreview", key = "#url")
    public ScrapeResult preview(String url) {
        for (Scraper scraper : scrapers) {
            if (scraper.supports(url)) {
                log.info(
                        "Fetching link preview url={} with scraper={}",
                        url,
                        scraper.getClass().getSimpleName());
                try {
                    return scraper.scrape(url);
                } catch (ScrapingException e) {
                    log.warn("Scraper failed for url={}: {}", url, e.getMessage());
                    return ScrapeResult.unsupported(url);
                } catch (Exception e) {
                    throw new ScrapingException(url, "Unexpected error: " + e.getMessage(), e);
                }
            }
        }
        return ScrapeResult.unsupported(url);
    }
}

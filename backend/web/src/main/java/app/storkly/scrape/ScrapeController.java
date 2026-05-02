package app.storkly.scrape;

import app.storkly.scrape.dto.ScrapePreviewRequest;
import app.storkly.scrape.dto.ScrapePreviewResponse;
import app.storkly.scraper.ScrapeResult;
import app.storkly.scraper.ScraperDispatcher;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ScrapeController {

    private final ScraperDispatcher scraperDispatcher;

    @PostMapping("/api/scrape/preview")
    public ScrapePreviewResponse preview(@RequestBody @Valid ScrapePreviewRequest request) {
        ScrapeResult result = scraperDispatcher.preview(request.url());
        return new ScrapePreviewResponse(
                result.url(),
                result.supported(),
                result.sourceSite(),
                result.title(),
                result.description(),
                result.imageUrl(),
                result.priceReference(),
                result.currency());
    }
}

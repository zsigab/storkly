package app.storkly.linkpreview;

import app.storkly.linkpreview.dto.LinkPreviewRequest;
import app.storkly.linkpreview.dto.LinkPreviewResponse;
import app.storkly.scraper.LinkPreviewService;
import app.storkly.scraper.ScrapeResult;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class LinkPreviewController {

    private final LinkPreviewService linkPreviewService;

    @PostMapping("/api/link-preview")
    public LinkPreviewResponse preview(@RequestBody @Valid LinkPreviewRequest request) {
        ScrapeResult result = linkPreviewService.preview(request.url());
        return new LinkPreviewResponse(
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

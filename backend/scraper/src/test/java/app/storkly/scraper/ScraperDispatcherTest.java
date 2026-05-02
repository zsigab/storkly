package app.storkly.scraper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import app.storkly.domain.item.SourceSite;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ScraperDispatcherTest {

    @Mock
    private Scraper scraper;

    private static final String URL = "https://example.com/product/123";

    @Test
    void preview_withMatchingScraper_delegatesAndReturnsResult() {
        ScrapeResult expected = ScrapeResult.builder()
                .url(URL)
                .supported(true)
                .sourceSite(SourceSite.AMAZON)
                .title("Test Product")
                .build();
        when(scraper.supports(URL)).thenReturn(true);
        when(scraper.scrape(URL)).thenReturn(expected);

        ScraperDispatcher dispatcher = new ScraperDispatcher(List.of(scraper));
        ScrapeResult result = dispatcher.preview(URL);

        assertThat(result).isEqualTo(expected);
    }

    @Test
    void preview_withNoMatchingScraper_returnsUnsupportedResult() {
        when(scraper.supports(URL)).thenReturn(false);

        ScraperDispatcher dispatcher = new ScraperDispatcher(List.of(scraper));
        ScrapeResult result = dispatcher.preview(URL);

        assertThat(result.supported()).isFalse();
        assertThat(result.sourceSite()).isEqualTo(SourceSite.MANUAL);
        assertThat(result.url()).isEqualTo(URL);
    }

    @Test
    void preview_withEmptyScraperList_returnsUnsupportedResult() {
        ScraperDispatcher dispatcher = new ScraperDispatcher(List.of());
        ScrapeResult result = dispatcher.preview(URL);

        assertThat(result.supported()).isFalse();
    }

    @Test
    void preview_whenScraperThrowsScrapingException_propagatesIt() {
        when(scraper.supports(URL)).thenReturn(true);
        when(scraper.scrape(URL)).thenThrow(new ScrapingException(URL, "Connection refused"));

        ScraperDispatcher dispatcher = new ScraperDispatcher(List.of(scraper));

        assertThatThrownBy(() -> dispatcher.preview(URL))
                .isInstanceOf(ScrapingException.class)
                .hasMessage("Connection refused");
    }

    @Test
    void preview_whenScraperThrowsUnexpectedException_wrapsInScrapingException() {
        when(scraper.supports(URL)).thenReturn(true);
        when(scraper.scrape(URL)).thenThrow(new RuntimeException("Unexpected"));

        ScraperDispatcher dispatcher = new ScraperDispatcher(List.of(scraper));

        assertThatThrownBy(() -> dispatcher.preview(URL))
                .isInstanceOf(ScrapingException.class)
                .hasMessageContaining("Unexpected error");
    }
}

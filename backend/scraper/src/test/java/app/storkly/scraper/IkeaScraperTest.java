package app.storkly.scraper;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class IkeaScraperTest {

    private IkeaScraper scraper;

    @BeforeEach
    void setUp() {
        scraper = new IkeaScraper();
    }

    @Test
    void supports_withIkeaUrl_returnsTrue() {
        assertThat(scraper.supports("https://www.ikea.com/ph/en/p/krummelur-00593407/")).isTrue();
        assertThat(scraper.supports("https://www.ikea.com/gb/en/p/some-product/")).isTrue();
    }

    @Test
    void supports_withNonIkeaUrl_returnsFalse() {
        assertThat(scraper.supports("https://www.lazada.com.ph/products/item")).isFalse();
        assertThat(scraper.supports("https://amazon.com/dp/B123")).isFalse();
    }

    @Test
    void supports_withNull_returnsFalse() {
        assertThat(scraper.supports(null)).isFalse();
    }
}

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
        assertThat(scraper.supports("https://www.ikea.com/ph/en/p/krummelur-00593407/"))
                .isTrue();
        assertThat(scraper.supports("https://www.ikea.com/gb/en/p/some-product/"))
                .isTrue();
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

    @Test
    void supports_rejectsHostSpoofingViaPathOrQuery() {
        // The previous url.contains("ikea.com") check was bypassable.
        assertThat(scraper.supports("https://evil.com/?fake=ikea.com")).isFalse();
        assertThat(scraper.supports("https://evil.com/ikea.com/p")).isFalse();
        assertThat(scraper.supports("https://evil-ikea.com/p")).isFalse();
        assertThat(scraper.supports("https://ikea.com.evil.com/p")).isFalse();
    }

    @Test
    void supports_rejectsNonHttpScheme() {
        assertThat(scraper.supports("file:///etc/passwd")).isFalse();
        assertThat(scraper.supports("javascript:alert(1)")).isFalse();
    }

    @Test
    void supports_acceptsApexAndSubdomain() {
        assertThat(scraper.supports("https://ikea.com/")).isTrue();
        assertThat(scraper.supports("https://www.ikea.com/")).isTrue();
        assertThat(scraper.supports("https://IKEA.com/")).isTrue();
    }
}

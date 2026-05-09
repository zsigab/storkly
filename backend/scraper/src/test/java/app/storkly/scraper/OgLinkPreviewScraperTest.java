package app.storkly.scraper;

import static org.assertj.core.api.Assertions.assertThat;

import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OgLinkPreviewScraperTest {

    private OgLinkPreviewScraper scraper;

    @BeforeEach
    void setUp() {
        scraper = new OgLinkPreviewScraper();
    }

    @Test
    void supports_withAnyUrl_returnsTrue() {
        assertThat(scraper.supports("https://lazada.com.ph/products/item-123")).isTrue();
        assertThat(scraper.supports("https://amazon.com/dp/B123")).isTrue();
        assertThat(scraper.supports("https://some-random-shop.com")).isTrue();
    }

    @Test
    void supports_withNull_returnsFalse() {
        assertThat(scraper.supports(null)).isFalse();
    }

    @Test
    void extract_withFullOgAndJsonLdOffer_returnsCompleteResult() {
        String html = """
                <html>
                <head>
                  <meta property="og:title" content="Baby Monitor HD | Lazada PH" />
                  <meta property="og:description" content="High quality baby monitor" />
                  <meta property="og:image" content="https://img.lazcdn.com/product.webp" />
                  <meta property="og:url" content="https://www.lazada.com.ph/products/baby-monitor" />
                  <script type="application/ld+json">
                  {
                    "@type": "Product",
                    "offers": {
                      "@type": "Offer",
                      "price": "2450.00",
                      "priceCurrency": "PHP"
                    }
                  }
                  </script>
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://www.lazada.com.ph/products/baby-monitor");

        assertThat(result.supported()).isTrue();
        assertThat(result.sourceSite()).isEqualTo(SourceSite.LAZADA_PH);
        assertThat(result.title()).isEqualTo("Baby Monitor HD");
        assertThat(result.description()).isEqualTo("High quality baby monitor");
        assertThat(result.imageUrl()).isEqualTo("https://img.lazcdn.com/product.webp");
        assertThat(result.priceReference()).isEqualTo(new BigDecimal("2450.00"));
        assertThat(result.currency()).isEqualTo("PHP");
        assertThat(result.url()).isEqualTo("https://www.lazada.com.ph/products/baby-monitor");
    }

    @Test
    void extract_withAggregateOffer_usesHighPrice() {
        String html = """
                <html>
                <head>
                  <meta property="og:image" content="https://img.example.com/product.jpg" />
                  <script type="application/ld+json">
                  {
                    "@type": "Product",
                    "offers": {
                      "@type": "AggregateOffer",
                      "lowPrice": "1200.00",
                      "highPrice": "3500.00",
                      "priceCurrency": "PHP"
                    }
                  }
                  </script>
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://www.lazada.com.ph/products/item");

        assertThat(result.priceReference()).isEqualTo(new BigDecimal("3500.00"));
    }

    @Test
    void extract_withNeitherTitleNorImage_returnsUnsupported() {
        String html = """
                <html>
                <head>
                  <meta name="description" content="A page without OG tags" />
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://example.com/product");

        assertThat(result.supported()).isFalse();
        assertThat(result.sourceSite()).isEqualTo(SourceSite.MANUAL);
    }

    @Test
    void extract_withTitleButNoImage_returnsSupported() {
        String html = """
                <html>
                <head>
                  <meta property="og:title" content="Some Product" />
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://example.com/product");

        assertThat(result.supported()).isTrue();
        assertThat(result.title()).isEqualTo("Some Product");
        assertThat(result.imageUrl()).isNull();
    }

    @Test
    void extract_withProductPriceMeta_extractsPrice() {
        String html = """
                <html>
                <head>
                  <meta property="og:title" content="Baby Stroller" />
                  <meta property="og:image" content="https://img.lazcdn.com/stroller.jpg" />
                  <meta property="product:price:amount" content="5999.00" />
                  <meta property="product:price:currency" content="PHP" />
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://www.lazada.com.ph/products/baby-stroller");

        assertThat(result.supported()).isTrue();
        assertThat(result.priceReference()).isEqualTo(new BigDecimal("5999.00"));
        assertThat(result.currency()).isEqualTo("PHP");
    }

    @Test
    void extract_withGraphJsonLd_findsProduct() {
        String html = """
                <html>
                <head>
                  <meta property="og:image" content="https://img.example.com/product.jpg" />
                  <script type="application/ld+json">
                  {
                    "@context": "https://schema.org",
                    "@graph": [
                      { "@type": "WebSite" },
                      {
                        "@type": "Product",
                        "offers": {
                          "@type": "Offer",
                          "price": "99.99",
                          "priceCurrency": "USD"
                        }
                      }
                    ]
                  }
                  </script>
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://shop.example.com/product");

        assertThat(result.supported()).isTrue();
        assertThat(result.priceReference()).isEqualTo(new BigDecimal("99.99"));
        assertThat(result.currency()).isEqualTo("USD");
    }

    @Test
    void extract_titleSuffixStripped() {
        String html = """
                <html>
                <head>
                  <meta property="og:title" content="Wireless Keyboard | Amazon" />
                  <meta property="og:image" content="https://img.amazon.com/keyboard.jpg" />
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://amazon.com/dp/B123");

        assertThat(result.title()).isEqualTo("Wireless Keyboard");
    }

    @Test
    void extract_withNoJsonLd_returnsImageAndTitleOnly() {
        String html = """
                <html>
                <head>
                  <meta property="og:title" content="Some Item" />
                  <meta property="og:image" content="https://img.example.com/item.jpg" />
                </head>
                </html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://example.com/item");

        assertThat(result.supported()).isTrue();
        assertThat(result.imageUrl()).isEqualTo("https://img.example.com/item.jpg");
        assertThat(result.priceReference()).isNull();
        assertThat(result.currency()).isNull();
    }

    @Test
    void extract_detectsSourceSiteFromUrl() {
        String html = """
                <html><head>
                  <meta property="og:image" content="https://img.example.com/item.jpg" />
                </head></html>
                """;

        Document lazadaDoc = Jsoup.parse(html);
        assertThat(scraper.extract(lazadaDoc, "https://www.lazada.com.ph/products/x")
                        .sourceSite())
                .isEqualTo(SourceSite.LAZADA_PH);

        Document shopeeDoc = Jsoup.parse(html);
        assertThat(scraper.extract(shopeeDoc, "https://shopee.ph/product/x").sourceSite())
                .isEqualTo(SourceSite.SHOPEE_PH);

        Document otherDoc = Jsoup.parse(html);
        assertThat(scraper.extract(otherDoc, "https://random-shop.example.com/item")
                        .sourceSite())
                .isEqualTo(SourceSite.MANUAL);
    }

    @Test
    void extract_usesOgUrlAsCanonical() {
        String html = """
                <html><head>
                  <meta property="og:image" content="https://img.example.com/item.jpg" />
                  <meta property="og:url" content="https://www.lazada.com.ph/products/canonical-url" />
                </head></html>
                """;

        Document doc = Jsoup.parse(html);
        ScrapeResult result = scraper.extract(doc, "https://www.lazada.com.ph/products/canonical-url?skuId=123");

        assertThat(result.url()).isEqualTo("https://www.lazada.com.ph/products/canonical-url");
    }
}

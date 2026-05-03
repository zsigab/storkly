package app.storkly.scraper;

import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
@Slf4j
public class OgLinkPreviewScraper extends JsoupScraper {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public boolean supports(@Nullable String url) {
        return url != null;
    }

    @Override
    protected ScrapeResult extract(Document doc, String url) {
        String imageUrl = emptyToNull(doc.select("meta[property=og:image]").attr("content"));

        String rawTitle = doc.select("meta[property=og:title]").attr("content");
        String title = rawTitle.isEmpty()
                ? null
                : rawTitle.replaceFirst("\\s\\|\\s.*$", "").strip();

        if (title == null && imageUrl == null) {
            log.debug("No og:title or og:image found for url={}", url);
            return ScrapeResult.unsupported(url);
        }

        String description =
                emptyToNull(doc.select("meta[property=og:description]").attr("content"));
        String ogUrl = doc.select("meta[property=og:url]").attr("content");
        String canonicalUrl = ogUrl.isEmpty() ? url : ogUrl;

        BigDecimal price = null;
        String currency = null;

        Elements jsonLdScripts = doc.select("script[type=application/ld+json]");
        for (Element script : jsonLdScripts) {
            try {
                JsonNode root = MAPPER.readTree(script.html());
                JsonNode product = findProduct(root);
                if (product != null) {
                    JsonNode offers = product.get("offers");
                    if (offers != null) {
                        price = extractPrice(offers);
                        currency = extractCurrency(offers);
                    }
                    break;
                }
            } catch (Exception e) {
                log.debug("Failed to parse JSON-LD for url={}: {}", url, e.getMessage());
            }
        }

        // Fallback: Facebook product OG tags used by Lazada PH, Shopee PH, and others
        if (price == null) {
            String priceStr =
                    emptyToNull(doc.select("meta[property=product:price:amount]").attr("content"));
            if (priceStr != null) {
                try {
                    price = new BigDecimal(priceStr.replace(",", ""));
                } catch (NumberFormatException e) {
                    log.debug("Failed to parse product:price:amount '{}': {}", priceStr, e.getMessage());
                }
            }
        }
        if (currency == null) {
            currency = emptyToNull(
                    doc.select("meta[property=product:price:currency]").attr("content"));
        }

        return ScrapeResult.builder()
                .url(canonicalUrl)
                .supported(true)
                .sourceSite(detectSourceSite(url))
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .priceReference(price)
                .currency(currency)
                .build();
    }

    @Nullable
    private JsonNode findProduct(JsonNode node) {
        if (node.isArray()) {
            for (JsonNode element : node) {
                JsonNode found = findProduct(element);
                if (found != null) {
                    return found;
                }
            }
        }
        if (node.isObject()) {
            if ("Product".equals(node.path("@type").asText(""))) {
                return node;
            }
            JsonNode graph = node.get("@graph");
            if (graph != null && graph.isArray()) {
                return findProduct(graph);
            }
        }
        return null;
    }

    @Nullable
    private BigDecimal extractPrice(JsonNode offers) {
        String type = offers.path("@type").asText("");
        String priceStr = null;
        if ("AggregateOffer".equals(type)) {
            priceStr = emptyToNull(offers.path("highPrice").asText(""));
        }
        if (priceStr == null) {
            priceStr = emptyToNull(offers.path("price").asText(""));
        }
        if (priceStr == null) {
            return null;
        }
        try {
            return new BigDecimal(priceStr.replace(",", ""));
        } catch (NumberFormatException e) {
            log.debug("Failed to parse price '{}': {}", priceStr, e.getMessage());
            return null;
        }
    }

    @Nullable
    private String extractCurrency(JsonNode offers) {
        return emptyToNull(offers.path("priceCurrency").asText(""));
    }

    private SourceSite detectSourceSite(String url) {
        if (url.contains("lazada.com.ph")) {
            return SourceSite.LAZADA_PH;
        }
        if (url.contains("shopee.ph")) {
            return SourceSite.SHOPEE_PH;
        }
        if (url.contains("amazon.com")) {
            return SourceSite.AMAZON;
        }
        if (url.contains("galaxus.")) {
            return SourceSite.GALAXUS;
        }
        return SourceSite.MANUAL;
    }

    @Nullable
    private static String emptyToNull(String s) {
        return s.isEmpty() ? null : s;
    }
}

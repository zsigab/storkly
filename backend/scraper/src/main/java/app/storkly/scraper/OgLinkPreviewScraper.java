package app.storkly.scraper;

import app.storkly.domain.item.SourceSite;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.jspecify.annotations.Nullable;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
@Order(100)
@Slf4j
public class OgLinkPreviewScraper extends JsoupScraper {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    // matches amazon.com, amazon.co.uk, amazon.de, amazon.com.au, etc.
    private static final Pattern AMAZON_HOST =
            Pattern.compile("https?://(?:[a-z0-9-]+\\.)?amazon\\.[a-z]{2,3}(?:\\.[a-z]{2})?(?:/|$)");

    @Override
    public boolean supports(@Nullable String url) {
        if (url == null) {
            return false;
        }
        try {
            String scheme = new URI(url).getScheme();
            return scheme != null && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"));
        } catch (URISyntaxException e) {
            return false;
        }
    }

    @Override
    protected ScrapeResult extract(Document doc, String url) {
        String imageUrl = emptyToNull(doc.select("meta[property=og:image]").attr("content"));

        if (isAmazonUrl(url)) {
            String amazonImage = extractAmazonImage(doc);
            if (amazonImage != null) {
                imageUrl = amazonImage;
            }
        }

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
            String priceStr = emptyToNull(
                    doc.select("meta[property=product:price:amount]").attr("content"));
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
        if (isAmazonUrl(url)) {
            return SourceSite.AMAZON;
        }
        if (url.contains("galaxus.")) {
            return SourceSite.GALAXUS;
        }
        return SourceSite.MANUAL;
    }

    private static boolean isAmazonUrl(String url) {
        return AMAZON_HOST.matcher(url).find();
    }

    @Nullable
    private String extractAmazonImage(Document doc) {
        Element landingImage = doc.getElementById("landingImage");
        if (landingImage == null) {
            return null;
        }
        String dynamicData = landingImage.attr("data-a-dynamic-image");
        if (dynamicData.isEmpty()) {
            return null;
        }
        try {
            Map<String, List<Integer>> imageMap =
                    MAPPER.readValue(dynamicData, new TypeReference<Map<String, List<Integer>>>() {});
            String bestUrl = null;
            int bestPixels = 0;
            for (Map.Entry<String, List<Integer>> entry : imageMap.entrySet()) {
                List<Integer> dims = entry.getValue();
                if (dims.size() >= 2) {
                    int pixels = dims.get(0) * dims.get(1);
                    if (pixels > bestPixels) {
                        bestPixels = pixels;
                        bestUrl = entry.getKey();
                    }
                }
            }
            return bestUrl;
        } catch (Exception e) {
            log.debug("Failed to parse Amazon dynamic image data: {}", e.getMessage());
            return null;
        }
    }

    @Nullable
    private static String emptyToNull(String s) {
        return s.isEmpty() ? null : s;
    }
}

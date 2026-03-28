package app.storkly.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.cors")
public record CorsProperties(List<String> allowedOrigins) {}

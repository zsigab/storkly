package app.storkly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.cookie")
public record CookieProperties(boolean secure) {}

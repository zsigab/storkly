package app.storkly.service.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.captcha")
public record TurnstileProperties(boolean enabled, String secretKey) {}

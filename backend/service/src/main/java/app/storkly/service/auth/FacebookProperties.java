package app.storkly.service.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.facebook")
public record FacebookProperties(String appSecret) {}

package app.storkly.image;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.images")
public record ImageStorageProperties(String uploadDir, int maxSizeMb) {}

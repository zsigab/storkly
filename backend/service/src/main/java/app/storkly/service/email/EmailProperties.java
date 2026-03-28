package app.storkly.service.email;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.mail")
public record EmailProperties(String from, String frontendUrl) {}

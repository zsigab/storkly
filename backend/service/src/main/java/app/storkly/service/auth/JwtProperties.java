package app.storkly.service.auth;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "storkly.jwt")
public record JwtProperties(
        String secret, Duration accessTokenExpiry, Duration refreshTokenExpiry, Duration rememberMeTokenExpiry) {}

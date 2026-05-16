package app.storkly.auth;

import app.storkly.domain.user.User;
import app.storkly.service.auth.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class JwtService {

    private final JwtProperties jwtProperties;
    private final SecretKey secretKey;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(jwtProperties.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return buildToken(user, jwtProperties.accessTokenExpiry().toMillis());
    }

    public String generateRefreshToken(User user, boolean rememberMe) {
        long expiryMillis = rememberMe
                ? jwtProperties.rememberMeTokenExpiry().toMillis()
                : jwtProperties.refreshTokenExpiry().toMillis();
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.email())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiryMillis))
                .claim("rem", rememberMe)
                .signWith(signingKey())
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean extractRememberMe(String token) {
        Boolean rem = parseClaims(token).get("rem", Boolean.class);
        return rem != null && rem;
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private String buildToken(User user, long expiryMillis) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(user.email())
                .issuedAt(new Date(now))
                .expiration(new Date(now + expiryMillis))
                .signWith(signingKey())
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        return secretKey;
    }
}

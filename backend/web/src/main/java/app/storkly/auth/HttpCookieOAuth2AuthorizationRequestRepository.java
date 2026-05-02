package app.storkly.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Base64;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

/**
 * Stores the in-flight OAuth2 authorization request in a short-lived cookie rather than
 * an HttpSession (ADR-010). Allows the security filter chain to stay STATELESS.
 *
 * <p>The cookie is SameSite=Lax so it is sent when Google redirects back to the callback
 * endpoint (a top-level cross-site GET navigation).
 */
@Component
@Slf4j
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    static final String COOKIE_NAME = "oauth2_auth_request";
    private static final int COOKIE_MAX_AGE = 180; // 3 minutes — enough for the OAuth flow

    @Override
    public @Nullable OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return getCookieValue(request).map(this::deserialize).orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(
            @Nullable OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (authorizationRequest == null) {
            clearCookie(response);
            return;
        }
        Cookie cookie = new Cookie(COOKIE_NAME, serialize(authorizationRequest));
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(COOKIE_MAX_AGE);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    @Override
    public @Nullable OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request, HttpServletResponse response) {
        OAuth2AuthorizationRequest req = loadAuthorizationRequest(request);
        if (req != null) {
            clearCookie(response);
        }
        return req;
    }

    private Optional<String> getCookieValue(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return Optional.of(cookie.getValue());
            }
        }
        return Optional.empty();
    }

    private void clearCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(COOKIE_NAME, "");
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String serialize(OAuth2AuthorizationRequest req) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(req);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize OAuth2AuthorizationRequest", e);
        }
    }

    @Nullable
    private OAuth2AuthorizationRequest deserialize(String encoded) {
        try (ObjectInputStream ois = new ObjectInputStream(
                new ByteArrayInputStream(Base64.getUrlDecoder().decode(encoded)))) {
            return (OAuth2AuthorizationRequest) ois.readObject();
        } catch (Exception e) {
            log.warn("Failed to deserialize OAuth2AuthorizationRequest: {}", e.getMessage());
            return null;
        }
    }
}

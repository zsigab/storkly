package app.storkly.auth;

import app.storkly.config.CookieProperties;
import app.storkly.domain.user.User;
import app.storkly.service.auth.JwtProperties;
import app.storkly.service.email.EmailProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OAuthSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final CookieProperties cookieProperties;
    private final EmailProperties emailProperties;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request, HttpServletResponse response, Authentication authentication)
            throws IOException {
        StorklyUserHolder principal = (StorklyUserHolder) authentication.getPrincipal();
        User user = principal.getStorklyUser();

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user, false);

        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshToken);

        response.sendRedirect(emailProperties.frontendUrl() + "/oauth/callback");
    }

    private void setAccessTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("access_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieProperties.secure());
        cookie.setPath("/");
        cookie.setMaxAge((int) jwtProperties.accessTokenExpiry().toSeconds());
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieProperties.secure());
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge((int) jwtProperties.refreshTokenExpiry().toSeconds());
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }
}

package app.storkly.auth;

import app.storkly.auth.dto.ForgotPasswordRequest;
import app.storkly.auth.dto.LoginRequest;
import app.storkly.auth.dto.RegisterRequest;
import app.storkly.auth.dto.ResetPasswordRequest;
import app.storkly.auth.dto.TokenResponse;
import app.storkly.auth.dto.VerifyEmailRequest;
import app.storkly.config.CookieProperties;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.user.User;
import app.storkly.service.auth.AuthService;
import app.storkly.service.auth.JwtProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserDetailsService userDetailsService;
    private final CookieProperties cookieProperties;

    @GetMapping("/me")
    public TokenResponse me(@AuthenticationPrincipal User user) {
        return new TokenResponse(user.id(), user.email(), user.displayName());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@RequestBody @Valid RegisterRequest request) {
        authService.register(request.email(), request.password(), request.displayName(), request.captchaToken());
    }

    @PostMapping("/verify-email")
    public void verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
        authService.verifyEmail(request.token());
    }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid LoginRequest request, HttpServletResponse response) {
        User user = authService.authenticate(request.email(), request.password());
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user, request.rememberMe());
        setAccessTokenCookie(response, accessToken);
        setRefreshTokenCookie(response, refreshToken, request.rememberMe());
        return new TokenResponse(user.id(), user.email(), user.displayName());
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractCookie(request, "refresh_token");
        if (refreshToken == null || !jwtService.isValid(refreshToken)) {
            throw new InvalidTokenException("Invalid or missing refresh token");
        }
        boolean rememberMe = jwtService.extractRememberMe(refreshToken);
        String email = jwtService.extractEmail(refreshToken);
        User user = (User) userDetailsService.loadUserByUsername(email);
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user, rememberMe);
        setAccessTokenCookie(response, newAccessToken);
        setRefreshTokenCookie(response, newRefreshToken, rememberMe);
        return new TokenResponse(user.id(), user.email(), user.displayName());
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        clearCookie(response, "access_token", "/");
        clearCookie(response, "refresh_token", "/api/auth/refresh");
    }

    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody @Valid ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody @Valid ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
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

    private void setRefreshTokenCookie(HttpServletResponse response, String token, boolean rememberMe) {
        Duration expiry = rememberMe ? jwtProperties.rememberMeTokenExpiry() : jwtProperties.refreshTokenExpiry();
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieProperties.secure());
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge((int) expiry.toSeconds());
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        Cookie cookie = new Cookie(name, "");
        cookie.setHttpOnly(true);
        cookie.setPath(path);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}

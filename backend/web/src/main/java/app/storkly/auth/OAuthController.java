package app.storkly.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Entry point for OAuth2 social login. Redirects the browser to Spring Security's
 * {@code /oauth2/authorization/{provider}} endpoint, which handles provider registration
 * and the authorization code flow from there.
 */
@RestController
@RequestMapping("/api/auth/oauth")
@Tag(name = "OAuth", description = "OAuth2 social login")
public class OAuthController {

    private static final java.util.Set<String> SUPPORTED_PROVIDERS = java.util.Set.of("google", "facebook");

    @GetMapping("/{provider}/authorize")
    @Operation(summary = "Initiate OAuth2 login for the given provider")
    public void authorize(@PathVariable String provider, HttpServletResponse response) throws IOException {
        if (!SUPPORTED_PROVIDERS.contains(provider)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown provider: " + provider);
        }
        response.sendRedirect("/oauth2/authorization/" + provider);
    }
}

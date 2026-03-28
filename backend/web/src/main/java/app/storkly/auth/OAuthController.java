package app.storkly.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Stub OAuth controller — Phase 2 will wire real providers (Google, Facebook).
 *
 * <p>Intended Phase 2 flow:
 * <ol>
 *   <li>Frontend redirects the browser to {@code /oauth2/authorization/{provider}}
 *       (handled automatically by Spring Security's OAuth2 client filter).
 *   <li>Spring redirects to the provider's consent screen.
 *   <li>Provider redirects back to {@code /login/oauth2/code/{provider}}
 *       (handled automatically by Spring Security).
 *   <li>Spring calls {@code StorklyOAuth2UserService} which delegates to
 *       {@code OAuthService#findOrCreate} to look up or provision the user.
 *   <li>{@code OAuthSuccessHandler} generates JWT tokens via {@code JwtService}
 *       and sets {@code access_token} / {@code refresh_token} httpOnly cookies,
 *       then redirects the browser back to the frontend.
 * </ol>
 *
 * <p>The {@code /api/auth/oauth/{provider}/authorize} endpoint below exists so that
 * the OpenAPI spec documents the OAuth entry point. In Phase 2 it will issue a
 * redirect to {@code /oauth2/authorization/{provider}}.
 */
@RestController
@RequestMapping("/api/auth/oauth")
@Tag(name = "OAuth", description = "OAuth2 social login (Phase 2)")
public class OAuthController {

    /**
     * Initiates the OAuth2 authorization flow for the given provider.
     *
     * <p>Phase 2: will redirect to {@code /oauth2/authorization/{provider}}, which
     * Spring Security intercepts and forwards to the provider's authorization endpoint.
     * Supported providers: {@code google}, {@code facebook}.
     */
    @GetMapping("/{provider}/authorize")
    @Operation(summary = "Initiate OAuth2 login (Phase 2 — not yet implemented)")
    public void authorize(@PathVariable String provider) {
        throw new ResponseStatusException(
                HttpStatus.NOT_IMPLEMENTED, "OAuth login is not yet available — coming in Phase 2");
    }
}

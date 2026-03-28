package app.storkly.service.auth;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Stub OAuth service — Phase 2 will implement provider-specific flows
 * (Google, Facebook) via Spring Security's OAuth2 client support.
 *
 * <p>Phase 2 responsibilities:
 * <ul>
 *   <li>Register a {@code OAuth2UserService<OAuth2UserRequest, OAuth2User>} that delegates
 *       here to find or create users.
 *   <li>Register an {@code AuthenticationSuccessHandler} that calls
 *       {@code JwtService} and sets httpOnly JWT cookies.
 *   <li>Wire real Google / Facebook client registrations in {@code application-prod.yml}.
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;

    /**
     * Finds an existing user by OAuth provider and provider-issued user ID, or creates a
     * new verified user if none exists.
     *
     * <p>OAuth users are created with {@code emailVerifiedAt} set to the current time because
     * the provider has already verified the email address. The {@code passwordHash} is left null
     * since OAuth users authenticate via the provider, not a local password.
     *
     * <p>Phase 2: implement using {@code OAuth2UserRequest} and provider-specific attribute
     * extraction (Google: {@code sub}; Facebook: {@code id}).
     *
     * @param provider    the OAuth provider (GOOGLE or FACEBOOK)
     * @param providerId  the provider-issued unique user identifier
     * @param email       the user's email address from the provider
     * @param displayName the user's display name from the provider
     * @return the found or newly created {@link User}
     * @throws UnsupportedOperationException always — Phase 2 not yet implemented
     */
    public User findOrCreate(AuthProvider provider, String providerId, String email, String displayName) {
        throw new UnsupportedOperationException("OAuth login not yet implemented — Phase 2");
    }
}

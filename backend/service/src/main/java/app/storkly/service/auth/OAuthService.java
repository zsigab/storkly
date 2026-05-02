package app.storkly.service.auth;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OAuthService {

    private final UserRepository userRepository;

    /**
     * Finds or creates a user for an OAuth login.
     *
     * <p>Lookup order:
     * <ol>
     *   <li>By provider + providerId — returning OAuth user found last time.
     *   <li>By email — verified LOCAL users are linked (providerId is persisted); unverified
     *       LOCAL stubs are deleted and replaced with a new OAuth user.
     *   <li>No match — a new OAuth-verified user is created.
     * </ol>
     */
    @Transactional
    public User findOrCreate(AuthProvider provider, String providerId, String email, String displayName) {
        // Fast path: exact match by provider + providerId
        return userRepository
                .findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> findOrCreateByEmail(provider, providerId, email, displayName));
    }

    private User findOrCreateByEmail(AuthProvider provider, String providerId, String email, String displayName) {
        return userRepository
                .findByEmail(email)
                .map(existing -> {
                    if (existing.emailVerifiedAt() != null) {
                        // Verified LOCAL user: link the OAuth provider and return
                        userRepository.addOAuthProvider(existing.id(), provider, providerId);
                        return existing;
                    } else {
                        // Unverified LOCAL stub: replace with OAuth user
                        userRepository.deleteById(existing.id());
                        return createOAuthUser(provider, providerId, email, displayName);
                    }
                })
                .orElseGet(() -> createOAuthUser(provider, providerId, email, displayName));
    }

    private User createOAuthUser(AuthProvider provider, String providerId, String email, String displayName) {
        User newUser = User.builder()
                .email(email)
                .displayName(displayName)
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        User saved = userRepository.save(newUser);
        userRepository.addOAuthProvider(saved.id(), provider, providerId);
        return saved;
    }
}

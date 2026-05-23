package app.storkly.service.auth;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.UserRepository;
import app.storkly.service.email.EmailProperties;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FacebookDataDeletionService {

    private final UserRepository userRepository;
    private final EmailProperties emailProperties;

    public record DeletionOutcome(String confirmationCode, String statusUrl) {}

    /**
     * Processes a Facebook data deletion request for the given Facebook user ID.
     *
     * <p>If the account has other login methods (password or another OAuth provider), only the
     * Facebook link is removed. If Facebook is the sole login, the full account is deleted.
     * Returns a unique confirmation code regardless of whether the user existed.
     */
    @Transactional
    public DeletionOutcome process(String facebookUserId) {
        String confirmationCode = UUID.randomUUID().toString();
        String statusUrl = emailProperties.frontendUrl() + "/data-deletion?code=" + confirmationCode;

        userRepository
                .findByProviderAndProviderId(AuthProvider.FACEBOOK, facebookUserId)
                .ifPresent(user -> {
                    boolean hasPassword = user.passwordHash() != null;
                    boolean hasOtherOAuth = userRepository.countOAuthProviders(user.id()) > 1;
                    if (hasPassword || hasOtherOAuth) {
                        userRepository.removeOAuthProvider(user.id(), AuthProvider.FACEBOOK);
                    } else {
                        userRepository.deleteById(user.id());
                    }
                });

        return new DeletionOutcome(confirmationCode, statusUrl);
    }
}

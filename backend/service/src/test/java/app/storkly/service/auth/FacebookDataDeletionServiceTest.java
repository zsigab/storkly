package app.storkly.service.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import app.storkly.service.email.EmailProperties;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FacebookDataDeletionServiceTest {

    @Mock
    private UserRepository userRepository;

    private FacebookDataDeletionService service;

    @BeforeEach
    void setUp() {
        service = new FacebookDataDeletionService(
                userRepository, new EmailProperties("noreply@test.cc", "http://localhost:5173"));
    }

    @Test
    void process_unknownFacebookUser_returnsConfirmationWithoutDeletingAnything() {
        when(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-unknown"))
                .thenReturn(Optional.empty());

        FacebookDataDeletionService.DeletionOutcome outcome = service.process("fb-unknown");

        assertThat(outcome.confirmationCode()).isNotBlank();
        assertThat(outcome.statusUrl()).contains("/data-deletion?code=");
        verify(userRepository, never()).deleteById(org.mockito.ArgumentMatchers.any());
        verify(userRepository, never())
                .removeOAuthProvider(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void process_facebookOnlyAccount_deletesAccount() {
        UUID userId = UUID.randomUUID();
        User facebookOnly = facebookUser(userId, null);
        when(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-123"))
                .thenReturn(Optional.of(facebookOnly));
        when(userRepository.countOAuthProviders(userId)).thenReturn(1);

        service.process("fb-123");

        verify(userRepository).deleteById(userId);
        verify(userRepository, never())
                .removeOAuthProvider(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void process_facebookPlusPassword_unlinksOnlyFacebook() {
        UUID userId = UUID.randomUUID();
        User hasPassword = facebookUser(userId, "hashed-password");
        when(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-456"))
                .thenReturn(Optional.of(hasPassword));
        when(userRepository.countOAuthProviders(userId)).thenReturn(1);

        service.process("fb-456");

        verify(userRepository).removeOAuthProvider(userId, AuthProvider.FACEBOOK);
        verify(userRepository, never()).deleteById(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void process_facebookPlusGoogle_unlinksOnlyFacebook() {
        UUID userId = UUID.randomUUID();
        User hasGoogle = facebookUser(userId, null);
        when(userRepository.findByProviderAndProviderId(AuthProvider.FACEBOOK, "fb-789"))
                .thenReturn(Optional.of(hasGoogle));
        when(userRepository.countOAuthProviders(userId)).thenReturn(2);

        service.process("fb-789");

        verify(userRepository).removeOAuthProvider(userId, AuthProvider.FACEBOOK);
        verify(userRepository, never()).deleteById(org.mockito.ArgumentMatchers.any());
    }

    private User facebookUser(UUID id, String passwordHash) {
        return User.builder()
                .id(id)
                .email("user@example.com")
                .passwordHash(passwordHash)
                .displayName("Test User")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}

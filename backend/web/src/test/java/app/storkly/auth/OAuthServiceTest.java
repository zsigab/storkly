package app.storkly.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import app.storkly.service.auth.OAuthService;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class OAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private OAuthService oAuthService;

    @BeforeEach
    void setUp() {
        oAuthService = new OAuthService(userRepository);
    }

    @Test
    void findOrCreate_newUser_createsVerifiedGoogleUser() {
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return User.builder()
                    .id(UUID.randomUUID())
                    .email(u.email())
                    .displayName(u.displayName())
                    .emailVerifiedAt(u.emailVerifiedAt())
                    .provider(u.provider())
                    .providerId(u.providerId())
                    .role(u.role())
                    .createdAt(u.createdAt())
                    .build();
        });

        User result = oAuthService.findOrCreate(AuthProvider.GOOGLE, "google-sub-123", "new@example.com", "New User");

        assertThat(result.email()).isEqualTo("new@example.com");
        assertThat(result.provider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(result.providerId()).isEqualTo("google-sub-123");
        assertThat(result.emailVerifiedAt()).isNotNull();
        assertThat(result.passwordHash()).isNull();
    }

    @Test
    void findOrCreate_existingGoogleUser_returnsSameUser() {
        User existing = User.builder()
                .id(UUID.randomUUID())
                .email("existing@example.com")
                .provider(AuthProvider.GOOGLE)
                .providerId("google-sub-123")
                .emailVerifiedAt(OffsetDateTime.now().minusDays(1))
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now().minusDays(1))
                .build();
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-123"))
                .thenReturn(Optional.of(existing));

        User result = oAuthService.findOrCreate(AuthProvider.GOOGLE, "google-sub-123", "existing@example.com", "User");

        assertThat(result).isEqualTo(existing);
        verify(userRepository, never()).save(any());
    }

    @Test
    void findOrCreate_verifiedLocalUser_linksProviderId() {
        UUID userId = UUID.randomUUID();
        User localUser = User.builder()
                .id(userId)
                .email("local@example.com")
                .passwordHash("hashed")
                .displayName("Local User")
                .emailVerifiedAt(OffsetDateTime.now().minusDays(7))
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now().minusDays(7))
                .build();
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-999"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(localUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        User result =
                oAuthService.findOrCreate(AuthProvider.GOOGLE, "google-sub-999", "local@example.com", "Local User");

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().providerId()).isEqualTo("google-sub-999");
        assertThat(saved.getValue().provider()).isEqualTo(AuthProvider.LOCAL);
        assertThat(saved.getValue().passwordHash()).isEqualTo("hashed");
        assertThat(result.id()).isEqualTo(userId);
    }

    @Test
    void findOrCreate_unverifiedLocalUser_replacesWithOAuthUser() {
        UUID staleId = UUID.randomUUID();
        User unverified = User.builder()
                .id(staleId)
                .email("stale@example.com")
                .passwordHash("hashed")
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now().minusHours(2))
                .build();
        when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-sub-new"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmail("stale@example.com")).thenReturn(Optional.of(unverified));
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return User.builder()
                    .id(UUID.randomUUID())
                    .email(u.email())
                    .displayName(u.displayName())
                    .emailVerifiedAt(u.emailVerifiedAt())
                    .provider(u.provider())
                    .providerId(u.providerId())
                    .role(u.role())
                    .createdAt(u.createdAt())
                    .build();
        });

        User result = oAuthService.findOrCreate(AuthProvider.GOOGLE, "google-sub-new", "stale@example.com", "New");

        verify(userRepository).deleteById(staleId);
        assertThat(result.provider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(result.emailVerifiedAt()).isNotNull();
    }
}

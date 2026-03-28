package app.storkly.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.EmailAlreadyRegisteredException;
import app.storkly.domain.exception.InvalidCredentialsException;
import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.EmailVerificationRepository;
import app.storkly.domain.user.PasswordResetRepository;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import app.storkly.service.auth.AuthService;
import app.storkly.service.auth.TurnstileService;
import app.storkly.service.email.EmailService;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailVerificationRepository emailVerificationRepository;

    @Mock
    private PasswordResetRepository passwordResetRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Mock
    private TurnstileService turnstileService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                emailVerificationRepository,
                passwordResetRepository,
                passwordEncoder,
                emailService,
                turnstileService);
    }

    @Test
    void register_success_savesUserAndSendsVerificationEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        UUID savedId = UUID.randomUUID();
        User savedUser = User.builder()
                .id(savedId)
                .email("alice@example.com")
                .passwordHash("hashed")
                .displayName("Alice")
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        authService.register("alice@example.com", "password123", "Alice", "captcha-token");

        verify(userRepository).save(any(User.class));
        verify(emailVerificationRepository).save(eq(savedId), anyString(), any(OffsetDateTime.class));
        verify(emailService).sendEmailVerification(eq("alice@example.com"), anyString());
    }

    @Test
    void register_emailAlreadyRegistered_throwsEmailAlreadyRegisteredException() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register("alice@example.com", "password123", "Alice", "captcha-token"))
                .isInstanceOf(EmailAlreadyRegisteredException.class)
                .hasMessageContaining("alice@example.com");

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendEmailVerification(anyString(), anyString());
    }

    @Test
    void register_captchaDisabled_doesNotCallTurnstileVerify() {
        // TurnstileService.assertValid is a no-op when disabled — we just verify it is called
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        UUID savedId = UUID.randomUUID();
        User savedUser = User.builder()
                .id(savedId)
                .email("alice@example.com")
                .passwordHash("hashed")
                .displayName("Alice")
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        authService.register("alice@example.com", "password123", "Alice", "any-token");

        // assertValid is always called; when disabled it is a no-op in TurnstileService
        verify(turnstileService).assertValid("any-token");
    }

    @Test
    void authenticate_validCredentials_returnsUser() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .passwordHash("hashed")
                .displayName("Alice")
                .emailVerifiedAt(OffsetDateTime.now())
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);

        User result = authService.authenticate("alice@example.com", "password123");

        assertThat(result.email()).isEqualTo("alice@example.com");
    }

    @Test
    void authenticate_wrongPassword_throwsInvalidCredentialsException() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("alice@example.com")
                .passwordHash("hashed")
                .displayName("Alice")
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.authenticate("alice@example.com", "wrongpass"))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void forgotPassword_unknownEmail_succeedsSilently() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        // Must not throw — avoids user enumeration
        authService.forgotPassword("unknown@example.com");

        verify(passwordResetRepository, never()).save(any(), anyString(), any());
        verify(emailService, never()).sendPasswordReset(anyString(), anyString());
    }

    @Test
    void resetPassword_success_updatesPasswordHash() {
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("alice@example.com")
                .passwordHash("old-hash")
                .displayName("Alice")
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        when(passwordResetRepository.consume("reset-token")).thenReturn(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.resetPassword("reset-token", "new-password");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().passwordHash()).isEqualTo("new-hash");
    }
}

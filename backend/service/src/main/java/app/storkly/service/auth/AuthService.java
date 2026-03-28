package app.storkly.service.auth;

import app.storkly.domain.exception.EmailAlreadyRegisteredException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.UserNotFoundException;
import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.EmailVerificationRepository;
import app.storkly.domain.user.PasswordResetRepository;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import app.storkly.service.email.EmailService;
import app.storkly.util.TokenUtil;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final TurnstileService turnstileService;

    @Transactional
    public void register(String email, String password, String displayName, String captchaToken) {
        turnstileService.assertValid(captchaToken);
        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException(email);
        }
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName)
                .provider(AuthProvider.LOCAL)
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        User saved = userRepository.save(user);
        String token = TokenUtil.generate();
        emailVerificationRepository.save(saved.id(), token, OffsetDateTime.now().plusHours(24));
        emailService.sendEmailVerification(email, token);
        log.info("Registered user: {}", email);
    }

    @Transactional
    public void verifyEmail(String token) {
        emailVerificationRepository.consume(token);
    }

    @Transactional
    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new UserNotFoundException(email));
        if (passwordEncoder.matches(password, user.passwordHash())) {
            return user;
        }
        throw new InvalidTokenException("Invalid credentials");
    }

    @Transactional
    public void forgotPassword(String email) {
        // No-op if email not found — avoid user enumeration
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = TokenUtil.generate();
            passwordResetRepository.save(user.id(), token, OffsetDateTime.now().plusHours(1));
            emailService.sendPasswordReset(email, token);
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        UUID userId = passwordResetRepository.consume(token);
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("id:" + userId));
        User updated = User.builder()
                .id(user.id())
                .email(user.email())
                .passwordHash(passwordEncoder.encode(newPassword))
                .displayName(user.displayName())
                .emailVerifiedAt(user.emailVerifiedAt())
                .provider(user.provider())
                .providerId(user.providerId())
                .role(user.role())
                .createdAt(user.createdAt())
                .build();
        userRepository.save(updated);
    }
}

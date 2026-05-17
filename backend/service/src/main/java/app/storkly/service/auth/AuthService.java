package app.storkly.service.auth;

import app.storkly.domain.exception.EmailAlreadyRegisteredException;
import app.storkly.domain.exception.InvalidCredentialsException;
import app.storkly.domain.exception.UserNotFoundException;
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
        userRepository.findByEmail(email).ifPresent(existing -> {
            if (existing.emailVerifiedAt() != null) {
                throw new EmailAlreadyRegisteredException(email);
            }
            // Unverified account — delete it so re-registration can proceed
            userRepository.deleteById(existing.id());
        });
        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .displayName(displayName)
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
        UUID userId = emailVerificationRepository.consume(token);
        User user = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("id:" + userId));
        User verified = User.builder()
                .id(user.id())
                .email(user.email())
                .passwordHash(user.passwordHash())
                .displayName(user.displayName())
                .emailVerifiedAt(OffsetDateTime.now())
                .role(user.role())
                .createdAt(user.createdAt())
                .build();
        userRepository.save(verified);
    }

    @Transactional
    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new InvalidCredentialsException());
        if (!passwordEncoder.matches(password, user.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        if (!user.isEnabled()) {
            throw new InvalidCredentialsException();
        }
        return user;
    }

    @Transactional
    public void forgotPassword(String email, String captchaToken) {
        turnstileService.assertValid(captchaToken);
        sendPasswordResetEmail(email);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Called by authenticated users — CAPTCHA not required
        sendPasswordResetEmail(email);
    }

    private void sendPasswordResetEmail(String email) {
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
                .role(user.role())
                .createdAt(user.createdAt())
                .build();
        userRepository.save(updated);
    }
}

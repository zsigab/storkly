package app.storkly.service.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailProperties emailProperties;

    @Async
    public void sendEmailVerification(String to, String token) {
        String subject = "Verify your Storkly account";
        String body = "Click the link to verify your email:\n\n"
                + emailProperties.frontendUrl() + "/verify-email?token=" + token + "\n\n"
                + "This link expires in 24 hours.";
        send(to, subject, body);
    }

    @Async
    public void sendClaimConfirmation(String to, String name, String itemTitle, String token) {
        String subject = "Confirm your claim on Storkly";
        String body = "Hi " + name + ",\n\n"
                + "You've requested to claim \"" + itemTitle + "\".\n\n"
                + "Click the link below to confirm your claim:\n\n"
                + emailProperties.frontendUrl() + "/claim/confirm?token=" + token + "\n\n"
                + "If your plans change, you can use this link to un-claim:\n\n"
                + emailProperties.frontendUrl() + "/un-claim?token=" + token + "\n\n"
                + "If you did not request this, you can ignore this email.";
        send(to, subject, body);
    }

    @Async
    public void sendPasswordReset(String to, String token) {
        String subject = "Reset your Storkly password";
        String body = "Click the link to reset your password:\n\n"
                + emailProperties.frontendUrl() + "/reset-password?token=" + token + "\n\n"
                + "This link expires in 1 hour.";
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailProperties.from());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}

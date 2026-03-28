package app.storkly.service.auth;

import app.storkly.domain.exception.InvalidTokenException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TurnstileService {

    private final TurnstileClient turnstileClient;
    private final TurnstileProperties properties;

    public void assertValid(String token) {
        if (!properties.enabled()) {
            return;
        }
        TurnstileResponse response = turnstileClient.verify(new TurnstileRequest(properties.secretKey(), token));
        if (!response.success()) {
            log.warn("Turnstile verification failed: {}", response.errorCodes());
            throw new InvalidTokenException("CAPTCHA verification failed");
        }
    }
}

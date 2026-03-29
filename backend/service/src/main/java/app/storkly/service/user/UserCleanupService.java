package app.storkly.service.user;

import app.storkly.domain.user.UserRepository;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCleanupService {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void purgeUnverifiedAccounts() {
        OffsetDateTime cutoff = OffsetDateTime.now().minusHours(24);
        userRepository.deleteUnverifiedBefore(cutoff);
        log.info("Purged unverified accounts older than 24 hours");
    }
}

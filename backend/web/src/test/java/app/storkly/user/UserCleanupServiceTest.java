package app.storkly.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import app.storkly.domain.user.UserRepository;
import app.storkly.service.user.UserCleanupService;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserCleanupServiceTest {

    @Mock
    private UserRepository userRepository;

    private UserCleanupService userCleanupService;

    @BeforeEach
    void setUp() {
        userCleanupService = new UserCleanupService(userRepository);
    }

    @Test
    void purgeUnverifiedAccounts_callsRepositoryWithCutoffBefore24Hours() {
        OffsetDateTime before = OffsetDateTime.now().minusHours(24);

        userCleanupService.purgeUnverifiedAccounts();

        ArgumentCaptor<OffsetDateTime> captor = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(userRepository).deleteUnverifiedBefore(captor.capture());
        assertThat(captor.getValue()).isBefore(before.plusSeconds(5));
        assertThat(captor.getValue()).isAfter(before.minusSeconds(5));
    }
}

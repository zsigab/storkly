package app.storkly.service.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void updateDisplayName_changesDisplayName() {
        UUID userId = UUID.randomUUID();
        String newName = "New Name";
        User original = User.builder()
                .id(userId)
                .email("user@example.com")
                .passwordHash("hash")
                .displayName("Old Name")
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();
        User updated = User.builder()
                .id(userId)
                .email("user@example.com")
                .passwordHash("hash")
                .displayName(newName)
                .emailVerifiedAt(OffsetDateTime.now())
                .role(UserRole.USER)
                .createdAt(OffsetDateTime.now())
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(updated));

        User result = userService.updateDisplayName(userId, newName);

        verify(userRepository).updateDisplayName(eq(userId), eq(newName));
        assertThat(result.displayName()).isEqualTo(newName);
    }
}

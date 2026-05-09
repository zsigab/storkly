package app.storkly.service.user;

import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User updateDisplayName(UUID userId, String displayName) {
        userRepository.updateDisplayName(userId, displayName);
        return userRepository.findById(userId).orElseThrow();
    }
}

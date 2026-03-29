package app.storkly.domain.user;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    User save(User user);

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);

    boolean existsByEmail(String email);

    void deleteById(UUID id);

    void deleteUnverifiedBefore(java.time.OffsetDateTime cutoff);
}

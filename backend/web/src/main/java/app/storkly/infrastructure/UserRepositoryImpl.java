package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.USER;

import app.storkly.domain.generated.tables.records.UserRecord;
import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final DSLContext dsl;

    @Override
    public User save(User user) {
        if (user.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(USER)
                    .set(USER.ID, id)
                    .set(USER.EMAIL, user.email())
                    .set(USER.PASSWORD_HASH, user.passwordHash())
                    .set(USER.DISPLAY_NAME, user.displayName())
                    .set(USER.EMAIL_VERIFIED_AT, user.emailVerifiedAt())
                    .set(USER.PROVIDER, mapProvider(user.provider()))
                    .set(USER.PROVIDER_ID, user.providerId())
                    .set(USER.ROLE, mapRole(user.role()))
                    .set(USER.CREATED_AT, user.createdAt())
                    .execute();
            return User.builder()
                    .id(id)
                    .email(user.email())
                    .passwordHash(user.passwordHash())
                    .displayName(user.displayName())
                    .emailVerifiedAt(user.emailVerifiedAt())
                    .provider(user.provider())
                    .providerId(user.providerId())
                    .role(user.role())
                    .createdAt(user.createdAt())
                    .build();
        } else {
            dsl.update(USER)
                    .set(USER.EMAIL, user.email())
                    .set(USER.PASSWORD_HASH, user.passwordHash())
                    .set(USER.DISPLAY_NAME, user.displayName())
                    .set(USER.EMAIL_VERIFIED_AT, user.emailVerifiedAt())
                    .set(USER.PROVIDER, mapProvider(user.provider()))
                    .set(USER.PROVIDER_ID, user.providerId())
                    .set(USER.ROLE, mapRole(user.role()))
                    .where(USER.ID.eq(user.id()))
                    .execute();
            return user;
        }
    }

    @Override
    public Optional<User> findById(UUID id) {
        return dsl.selectFrom(USER).where(USER.ID.eq(id)).fetchOptional().map(this::toUser);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return dsl.selectFrom(USER).where(USER.EMAIL.eq(email)).fetchOptional().map(this::toUser);
    }

    @Override
    public Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId) {
        return dsl.selectFrom(USER)
                .where(USER.PROVIDER.eq(mapProvider(provider)).and(USER.PROVIDER_ID.eq(providerId)))
                .fetchOptional()
                .map(this::toUser);
    }

    @Override
    public boolean existsByEmail(String email) {
        return dsl.fetchCount(USER, USER.EMAIL.eq(email)) > 0;
    }

    private User toUser(UserRecord r) {
        return User.builder()
                .id(r.getId())
                .email(r.getEmail())
                .passwordHash(r.getPasswordHash())
                .displayName(r.getDisplayName())
                .emailVerifiedAt(r.getEmailVerifiedAt())
                .provider(mapProvider(r.getProvider()))
                .providerId(r.getProviderId())
                .role(mapRole(r.getRole()))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private app.storkly.domain.generated.enums.AuthProvider mapProvider(AuthProvider p) {
        return app.storkly.domain.generated.enums.AuthProvider.valueOf(p.name());
    }

    private AuthProvider mapProvider(app.storkly.domain.generated.enums.AuthProvider p) {
        if (p == null) {
            return AuthProvider.LOCAL;
        }
        return AuthProvider.valueOf(p.name());
    }

    private app.storkly.domain.generated.enums.UserRole mapRole(UserRole r) {
        return app.storkly.domain.generated.enums.UserRole.valueOf(r.name());
    }

    private UserRole mapRole(app.storkly.domain.generated.enums.UserRole r) {
        if (r == null) {
            return UserRole.USER;
        }
        return UserRole.valueOf(r.name());
    }
}

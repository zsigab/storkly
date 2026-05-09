package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.USER;
import static app.storkly.domain.generated.Tables.USER_OAUTH_PROVIDER;

import app.storkly.domain.generated.tables.records.UserRecord;
import app.storkly.domain.user.AuthProvider;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
import app.storkly.domain.user.UserRole;
import java.time.OffsetDateTime;
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
                    .set(USER.ROLE, mapRole(user.role()))
                    .set(USER.CREATED_AT, user.createdAt())
                    .execute();
            return User.builder()
                    .id(id)
                    .email(user.email())
                    .passwordHash(user.passwordHash())
                    .displayName(user.displayName())
                    .emailVerifiedAt(user.emailVerifiedAt())
                    .role(user.role())
                    .createdAt(user.createdAt())
                    .build();
        } else {
            dsl.update(USER)
                    .set(USER.EMAIL, user.email())
                    .set(USER.PASSWORD_HASH, user.passwordHash())
                    .set(USER.DISPLAY_NAME, user.displayName())
                    .set(USER.EMAIL_VERIFIED_AT, user.emailVerifiedAt())
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
        return dsl.select(USER.fields())
                .from(USER)
                .join(USER_OAUTH_PROVIDER)
                .on(USER_OAUTH_PROVIDER.USER_ID.eq(USER.ID))
                .where(USER_OAUTH_PROVIDER
                        .PROVIDER
                        .eq(mapProvider(provider))
                        .and(USER_OAUTH_PROVIDER.PROVIDER_ID.eq(providerId)))
                .fetchOptional()
                .map(r -> toUser(r.into(USER)));
    }

    @Override
    public void addOAuthProvider(UUID userId, AuthProvider provider, String providerId) {
        dsl.insertInto(USER_OAUTH_PROVIDER)
                .set(USER_OAUTH_PROVIDER.USER_ID, userId)
                .set(USER_OAUTH_PROVIDER.PROVIDER, mapProvider(provider))
                .set(USER_OAUTH_PROVIDER.PROVIDER_ID, providerId)
                .set(USER_OAUTH_PROVIDER.LINKED_AT, OffsetDateTime.now())
                .onConflict(USER_OAUTH_PROVIDER.USER_ID, USER_OAUTH_PROVIDER.PROVIDER)
                .doUpdate()
                .set(USER_OAUTH_PROVIDER.PROVIDER_ID, providerId)
                .execute();
    }

    @Override
    public boolean existsByEmail(String email) {
        return dsl.fetchCount(USER, USER.EMAIL.eq(email)) > 0;
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(USER).where(USER.ID.eq(id)).execute();
    }

    @Override
    public void deleteUnverifiedBefore(OffsetDateTime cutoff) {
        dsl.deleteFrom(USER)
                .where(USER.EMAIL_VERIFIED_AT.isNull().and(USER.CREATED_AT.lt(cutoff)))
                .execute();
    }

    @Override
    public void updateDisplayName(UUID userId, String displayName) {
        dsl.update(USER).set(USER.DISPLAY_NAME, displayName).where(USER.ID.eq(userId)).execute();
    }

    private User toUser(UserRecord r) {
        return User.builder()
                .id(r.getId())
                .email(r.getEmail())
                .passwordHash(r.getPasswordHash())
                .displayName(r.getDisplayName())
                .emailVerifiedAt(r.getEmailVerifiedAt())
                .role(mapRole(r.getRole()))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private app.storkly.domain.generated.enums.AuthProvider mapProvider(AuthProvider p) {
        return app.storkly.domain.generated.enums.AuthProvider.valueOf(p.name());
    }

    private UserRole mapRole(app.storkly.domain.generated.enums.UserRole r) {
        if (r == null) {
            return UserRole.USER;
        }
        return UserRole.valueOf(r.name());
    }

    private app.storkly.domain.generated.enums.UserRole mapRole(UserRole r) {
        return app.storkly.domain.generated.enums.UserRole.valueOf(r.name());
    }
}

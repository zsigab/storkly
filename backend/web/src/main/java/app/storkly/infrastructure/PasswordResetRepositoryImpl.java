package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.PASSWORD_RESET_TOKEN;

import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.generated.tables.records.PasswordResetTokenRecord;
import app.storkly.domain.user.PasswordResetRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class PasswordResetRepositoryImpl implements PasswordResetRepository {

    private final DSLContext dsl;

    @Override
    public void save(UUID userId, String token, OffsetDateTime expiresAt) {
        dsl.insertInto(PASSWORD_RESET_TOKEN)
                .set(PASSWORD_RESET_TOKEN.USER_ID, userId)
                .set(PASSWORD_RESET_TOKEN.TOKEN, token)
                .set(PASSWORD_RESET_TOKEN.EXPIRES_AT, expiresAt)
                .execute();
    }

    @Override
    public UUID consume(String token) {
        PasswordResetTokenRecord record = dsl.selectFrom(PASSWORD_RESET_TOKEN)
                .where(PASSWORD_RESET_TOKEN.TOKEN.eq(token))
                .fetchOne();
        if (record == null) {
            throw new InvalidTokenException("Invalid or unknown password reset token");
        }
        if (record.getUsedAt() != null) {
            throw new InvalidTokenException("Password reset token has already been used");
        }
        if (record.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidTokenException("Password reset token has expired");
        }
        dsl.update(PASSWORD_RESET_TOKEN)
                .set(PASSWORD_RESET_TOKEN.USED_AT, OffsetDateTime.now())
                .where(PASSWORD_RESET_TOKEN.TOKEN.eq(token))
                .execute();
        return record.getUserId();
    }
}

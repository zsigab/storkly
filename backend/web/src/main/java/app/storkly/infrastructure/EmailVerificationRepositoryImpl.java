package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.EMAIL_VERIFICATION_TOKEN;
import static app.storkly.domain.generated.Tables.USER;

import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.generated.tables.records.EmailVerificationTokenRecord;
import app.storkly.domain.user.EmailVerificationRepository;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class EmailVerificationRepositoryImpl implements EmailVerificationRepository {

    private final DSLContext dsl;

    @Override
    public void save(UUID userId, String token, OffsetDateTime expiresAt) {
        dsl.insertInto(EMAIL_VERIFICATION_TOKEN)
                .set(EMAIL_VERIFICATION_TOKEN.USER_ID, userId)
                .set(EMAIL_VERIFICATION_TOKEN.TOKEN, token)
                .set(EMAIL_VERIFICATION_TOKEN.EXPIRES_AT, expiresAt)
                .execute();
    }

    @Override
    public void consume(String token) {
        EmailVerificationTokenRecord record = dsl.selectFrom(EMAIL_VERIFICATION_TOKEN)
                .where(EMAIL_VERIFICATION_TOKEN.TOKEN.eq(token))
                .fetchOne();
        if (record == null) {
            throw new InvalidTokenException("Invalid or unknown verification token");
        }
        if (record.getUsedAt() != null) {
            throw new InvalidTokenException("Verification token has already been used");
        }
        if (record.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new InvalidTokenException("Verification token has expired");
        }
        OffsetDateTime now = OffsetDateTime.now();
        dsl.update(EMAIL_VERIFICATION_TOKEN)
                .set(EMAIL_VERIFICATION_TOKEN.USED_AT, now)
                .where(EMAIL_VERIFICATION_TOKEN.TOKEN.eq(token))
                .execute();
        dsl.update(USER)
                .set(USER.EMAIL_VERIFIED_AT, now)
                .where(USER.ID.eq(record.getUserId()))
                .execute();
    }
}

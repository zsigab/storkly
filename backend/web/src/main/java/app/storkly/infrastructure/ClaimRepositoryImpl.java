package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.CLAIM;

import app.storkly.domain.generated.tables.records.ClaimRecord;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ClaimRepositoryImpl implements ClaimRepository {

    private final DSLContext dsl;

    @Override
    public Claim save(Claim claim) {
        UUID id = UUID.randomUUID();
        dsl.insertInto(CLAIM)
                .set(CLAIM.ID, id)
                .set(CLAIM.ITEM_ID, claim.itemId())
                .set(CLAIM.CLAIMER_USER_ID, claim.claimerUserId())
                .set(CLAIM.CLAIMER_NAME, claim.claimerName())
                .set(CLAIM.CLAIMER_EMAIL, claim.claimerEmail())
                .set(CLAIM.QUANTITY_CLAIMED, claim.quantityClaimed())
                .set(CLAIM.CLAIM_TOKEN, claim.claimToken())
                .set(CLAIM.CLAIMED_AT, claim.claimedAt())
                .execute();
        return Claim.builder()
                .id(id)
                .itemId(claim.itemId())
                .claimerUserId(claim.claimerUserId())
                .claimerName(claim.claimerName())
                .claimerEmail(claim.claimerEmail())
                .quantityClaimed(claim.quantityClaimed())
                .claimToken(claim.claimToken())
                .claimedAt(claim.claimedAt())
                .build();
    }

    @Override
    public Optional<Claim> findById(UUID id) {
        return dsl.selectFrom(CLAIM).where(CLAIM.ID.eq(id)).fetchOptional().map(this::toClaim);
    }

    @Override
    public Optional<Claim> findByClaimToken(String token) {
        return dsl.selectFrom(CLAIM)
                .where(CLAIM.CLAIM_TOKEN.eq(token))
                .fetchOptional()
                .map(this::toClaim);
    }

    @Override
    public List<Claim> findActiveByItemId(UUID itemId) {
        return dsl.selectFrom(CLAIM)
                .where(CLAIM.ITEM_ID.eq(itemId).and(CLAIM.RELEASED_AT.isNull()))
                .orderBy(CLAIM.CLAIMED_AT.asc())
                .fetch()
                .map(this::toClaim);
    }

    @Override
    public boolean existsActiveByItemId(UUID itemId) {
        return dsl.fetchCount(CLAIM, CLAIM.ITEM_ID.eq(itemId).and(CLAIM.RELEASED_AT.isNull())) > 0;
    }

    @Override
    public void release(UUID id, OffsetDateTime releasedAt) {
        dsl.update(CLAIM)
                .set(CLAIM.RELEASED_AT, releasedAt)
                .where(CLAIM.ID.eq(id))
                .execute();
    }

    private Claim toClaim(ClaimRecord r) {
        return Claim.builder()
                .id(r.getId())
                .itemId(r.getItemId())
                .claimerUserId(r.getClaimerUserId())
                .claimerName(r.getClaimerName())
                .claimerEmail(r.getClaimerEmail())
                .quantityClaimed(r.getQuantityClaimed())
                .claimToken(r.getClaimToken())
                .claimedAt(r.getClaimedAt())
                .releasedAt(r.getReleasedAt())
                .build();
    }
}

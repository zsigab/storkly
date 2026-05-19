package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.CLAIM;
import static app.storkly.domain.generated.Tables.ITEM;
import static app.storkly.domain.generated.Tables.REGISTRY;

import app.storkly.domain.generated.tables.records.ClaimRecord;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.MyClaimView;
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
                .set(CLAIM.AMOUNT_CONTRIBUTED, claim.amountContributed())
                .set(CLAIM.PERCENTAGE_CONTRIBUTED, claim.percentageContributed())
                .set(CLAIM.CLAIM_TOKEN, claim.claimToken())
                .set(CLAIM.CLAIMED_AT, claim.claimedAt())
                .set(CLAIM.DELIVERY_OPTION_ID, claim.deliveryOptionId())
                .set(CLAIM.DELIVERY_TYPE, claim.deliveryType())
                .set(CLAIM.CONFIRMED_AT, claim.confirmedAt())
                .execute();
        return Claim.builder()
                .id(id)
                .itemId(claim.itemId())
                .claimerUserId(claim.claimerUserId())
                .claimerName(claim.claimerName())
                .claimerEmail(claim.claimerEmail())
                .quantityClaimed(claim.quantityClaimed())
                .amountContributed(claim.amountContributed())
                .percentageContributed(claim.percentageContributed())
                .claimToken(claim.claimToken())
                .claimedAt(claim.claimedAt())
                .deliveryOptionId(claim.deliveryOptionId())
                .deliveryType(claim.deliveryType())
                .confirmedAt(claim.confirmedAt())
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
                .where(CLAIM.ITEM_ID.eq(itemId).and(CLAIM.RELEASED_AT.isNull()).and(CLAIM.CONFIRMED_AT.isNotNull()))
                .orderBy(CLAIM.CLAIMED_AT.asc())
                .fetch()
                .map(this::toClaim);
    }

    @Override
    public List<Claim> findAllByItemId(UUID itemId) {
        return dsl.selectFrom(CLAIM)
                .where(CLAIM.ITEM_ID.eq(itemId))
                .orderBy(CLAIM.CLAIMED_AT.asc())
                .fetch()
                .map(this::toClaim);
    }

    @Override
    public boolean existsActiveByItemId(UUID itemId) {
        return dsl.fetchCount(
                        CLAIM,
                        CLAIM.ITEM_ID.eq(itemId).and(CLAIM.RELEASED_AT.isNull()).and(CLAIM.CONFIRMED_AT.isNotNull()))
                > 0;
    }

    @Override
    public boolean existsByDeliveryOptionId(UUID deliveryOptionId) {
        return dsl.fetchCount(CLAIM, CLAIM.DELIVERY_OPTION_ID.eq(deliveryOptionId)) > 0;
    }

    @Override
    public boolean existsActiveByUserAndRegistry(UUID userId, UUID registryId) {
        return dsl.fetchCount(dsl.selectOne()
                        .from(CLAIM)
                        .join(ITEM)
                        .on(CLAIM.ITEM_ID.eq(ITEM.ID))
                        .where(ITEM.REGISTRY_ID
                                .eq(registryId)
                                .and(CLAIM.CLAIMER_USER_ID.eq(userId))
                                .and(CLAIM.RELEASED_AT.isNull())
                                .and(CLAIM.CONFIRMED_AT.isNotNull())))
                > 0;
    }

    @Override
    public List<Claim> findActiveByRegistryId(UUID registryId) {
        return dsl.select(CLAIM.asterisk())
                .from(CLAIM)
                .join(ITEM)
                .on(CLAIM.ITEM_ID.eq(ITEM.ID))
                .where(ITEM.REGISTRY_ID
                        .eq(registryId)
                        .and(CLAIM.RELEASED_AT.isNull())
                        .and(CLAIM.CONFIRMED_AT.isNotNull()))
                .orderBy(CLAIM.CLAIMED_AT.desc())
                .fetchInto(CLAIM)
                .map(this::toClaim);
    }

    @Override
    public List<Claim> findAllByRegistryId(UUID registryId) {
        return dsl.select(CLAIM.asterisk())
                .from(CLAIM)
                .join(ITEM)
                .on(CLAIM.ITEM_ID.eq(ITEM.ID))
                .where(ITEM.REGISTRY_ID.eq(registryId))
                .orderBy(CLAIM.CLAIMED_AT.asc())
                .fetchInto(CLAIM)
                .map(this::toClaim);
    }

    @Override
    public List<MyClaimView> findActiveByUserId(UUID userId) {
        return dsl.select(
                        CLAIM.ID,
                        CLAIM.ITEM_ID,
                        ITEM.TITLE,
                        REGISTRY.ID,
                        REGISTRY.NAME,
                        REGISTRY.SLUG,
                        CLAIM.QUANTITY_CLAIMED,
                        CLAIM.AMOUNT_CONTRIBUTED,
                        CLAIM.PERCENTAGE_CONTRIBUTED,
                        CLAIM.DELIVERY_OPTION_ID,
                        CLAIM.DELIVERY_TYPE,
                        CLAIM.CLAIMED_AT,
                        CLAIM.RECEIVED_AT)
                .from(CLAIM)
                .join(ITEM)
                .on(CLAIM.ITEM_ID.eq(ITEM.ID))
                .join(REGISTRY)
                .on(ITEM.REGISTRY_ID.eq(REGISTRY.ID))
                .where(CLAIM.CLAIMER_USER_ID
                        .eq(userId)
                        .and(CLAIM.RELEASED_AT.isNull())
                        .and(CLAIM.CONFIRMED_AT.isNotNull()))
                .orderBy(CLAIM.CLAIMED_AT.desc())
                .fetch(r -> MyClaimView.builder()
                        .claimId(r.get(CLAIM.ID))
                        .itemId(r.get(CLAIM.ITEM_ID))
                        .itemTitle(r.get(ITEM.TITLE))
                        .registryId(r.get(REGISTRY.ID))
                        .registryName(r.get(REGISTRY.NAME))
                        .registrySlug(r.get(REGISTRY.SLUG))
                        .quantityClaimed(r.get(CLAIM.QUANTITY_CLAIMED))
                        .amountContributed(r.get(CLAIM.AMOUNT_CONTRIBUTED))
                        .percentageContributed(r.get(CLAIM.PERCENTAGE_CONTRIBUTED))
                        .deliveryOptionId(r.get(CLAIM.DELIVERY_OPTION_ID))
                        .deliveryType(r.get(CLAIM.DELIVERY_TYPE))
                        .claimedAt(r.get(CLAIM.CLAIMED_AT))
                        .receivedAt(r.get(CLAIM.RECEIVED_AT))
                        .build());
    }

    @Override
    public void release(UUID id, OffsetDateTime releasedAt) {
        dsl.update(CLAIM)
                .set(CLAIM.RELEASED_AT, releasedAt)
                .where(CLAIM.ID.eq(id))
                .execute();
    }

    @Override
    public void confirm(UUID id, OffsetDateTime confirmedAt) {
        dsl.update(CLAIM)
                .set(CLAIM.CONFIRMED_AT, confirmedAt)
                .where(CLAIM.ID.eq(id))
                .execute();
    }

    @Override
    public void receive(UUID id, OffsetDateTime receivedAt) {
        dsl.update(CLAIM)
                .set(CLAIM.RECEIVED_AT, receivedAt)
                .set(CLAIM.AMOUNT_RECEIVED, CLAIM.AMOUNT_CONTRIBUTED)
                .where(CLAIM.ID.eq(id))
                .execute();
    }

    @Override
    public void updateDeliveryOption(UUID id, java.util.UUID deliveryOptionId, String deliveryType) {
        dsl.update(CLAIM)
                .set(CLAIM.DELIVERY_OPTION_ID, deliveryOptionId)
                .set(CLAIM.DELIVERY_TYPE, deliveryType)
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
                .amountContributed(r.getAmountContributed())
                .percentageContributed(r.getPercentageContributed())
                .claimToken(r.getClaimToken())
                .claimedAt(r.getClaimedAt())
                .releasedAt(r.getReleasedAt())
                .deliveryOptionId(r.getDeliveryOptionId())
                .deliveryType(r.getDeliveryType())
                .receivedAt(r.getReceivedAt())
                .amountReceived(r.getAmountReceived())
                .confirmedAt(r.getConfirmedAt())
                .build();
    }
}

package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.REGISTRY_SUBSCRIPTION;
import static app.storkly.domain.generated.Tables.USER;

import app.storkly.domain.registry.RegistrySubscriber;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RegistrySubscriptionRepositoryImpl implements RegistrySubscriptionRepository {

    private final DSLContext dsl;

    @Override
    public void save(UUID userId, UUID registryId) {
        dsl.insertInto(REGISTRY_SUBSCRIPTION)
                .set(REGISTRY_SUBSCRIPTION.USER_ID, userId)
                .set(REGISTRY_SUBSCRIPTION.REGISTRY_ID, registryId)
                .set(REGISTRY_SUBSCRIPTION.JOINED_AT, OffsetDateTime.now())
                .execute();
    }

    @Override
    public boolean exists(UUID userId, UUID registryId) {
        return dsl.fetchCount(
                        REGISTRY_SUBSCRIPTION,
                        REGISTRY_SUBSCRIPTION.USER_ID.eq(userId).and(REGISTRY_SUBSCRIPTION.REGISTRY_ID.eq(registryId)))
                > 0;
    }

    @Override
    public void delete(UUID userId, UUID registryId) {
        dsl.deleteFrom(REGISTRY_SUBSCRIPTION)
                .where(REGISTRY_SUBSCRIPTION.USER_ID.eq(userId).and(REGISTRY_SUBSCRIPTION.REGISTRY_ID.eq(registryId)))
                .execute();
    }

    @Override
    public List<RegistrySubscriber> findByRegistryId(UUID registryId) {
        return dsl.select(REGISTRY_SUBSCRIPTION.USER_ID, USER.DISPLAY_NAME, REGISTRY_SUBSCRIPTION.JOINED_AT)
                .from(REGISTRY_SUBSCRIPTION)
                .join(USER)
                .on(USER.ID.eq(REGISTRY_SUBSCRIPTION.USER_ID))
                .where(REGISTRY_SUBSCRIPTION.REGISTRY_ID.eq(registryId))
                .orderBy(REGISTRY_SUBSCRIPTION.JOINED_AT.desc())
                .fetch()
                .map(record -> new RegistrySubscriber(
                        record.get(REGISTRY_SUBSCRIPTION.USER_ID),
                        record.get(USER.DISPLAY_NAME),
                        record.get(REGISTRY_SUBSCRIPTION.JOINED_AT)));
    }
}

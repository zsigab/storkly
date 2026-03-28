package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.REGISTRY_CO_OWNER;

import app.storkly.domain.registry.RegistryCoOwnerRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RegistryCoOwnerRepositoryImpl implements RegistryCoOwnerRepository {

    private final DSLContext dsl;

    @Override
    public void add(UUID registryId, UUID userId) {
        dsl.insertInto(REGISTRY_CO_OWNER)
                .set(REGISTRY_CO_OWNER.REGISTRY_ID, registryId)
                .set(REGISTRY_CO_OWNER.USER_ID, userId)
                .set(REGISTRY_CO_OWNER.ADDED_AT, OffsetDateTime.now())
                .onDuplicateKeyIgnore()
                .execute();
    }

    @Override
    public void remove(UUID registryId, UUID userId) {
        dsl.deleteFrom(REGISTRY_CO_OWNER)
                .where(REGISTRY_CO_OWNER.REGISTRY_ID.eq(registryId).and(REGISTRY_CO_OWNER.USER_ID.eq(userId)))
                .execute();
    }

    @Override
    public boolean isCoOwner(UUID registryId, UUID userId) {
        return dsl.fetchCount(
                        REGISTRY_CO_OWNER,
                        REGISTRY_CO_OWNER.REGISTRY_ID.eq(registryId).and(REGISTRY_CO_OWNER.USER_ID.eq(userId)))
                > 0;
    }

    @Override
    public List<UUID> findUserIdsByRegistryId(UUID registryId) {
        return dsl.select(REGISTRY_CO_OWNER.USER_ID)
                .from(REGISTRY_CO_OWNER)
                .where(REGISTRY_CO_OWNER.REGISTRY_ID.eq(registryId))
                .fetch(REGISTRY_CO_OWNER.USER_ID);
    }
}

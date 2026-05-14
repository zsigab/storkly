package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.DELIVERY_OPTION;

import app.storkly.domain.generated.tables.records.DeliveryOptionRecord;
import app.storkly.domain.item.DeliveryOption;
import app.storkly.domain.item.DeliveryOptionRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DeliveryOptionRepositoryImpl implements DeliveryOptionRepository {

    private final DSLContext dsl;

    @Override
    public DeliveryOption save(DeliveryOption option) {
        UUID id = option.id() != null ? option.id() : UUID.randomUUID();
        dsl.insertInto(DELIVERY_OPTION)
                .set(DELIVERY_OPTION.ID, id)
                .set(DELIVERY_OPTION.REGISTRY_ID, option.registryId())
                .set(DELIVERY_OPTION.TYPE, option.type())
                .set(DELIVERY_OPTION.LABEL, option.label())
                .set(DELIVERY_OPTION.DESCRIPTION, option.description())
                .set(DELIVERY_OPTION.ENABLED, option.enabled())
                .set(DELIVERY_OPTION.SORT_ORDER, option.sortOrder())
                .onDuplicateKeyUpdate()
                .set(DELIVERY_OPTION.LABEL, option.label())
                .set(DELIVERY_OPTION.DESCRIPTION, option.description())
                .set(DELIVERY_OPTION.ENABLED, option.enabled())
                .set(DELIVERY_OPTION.SORT_ORDER, option.sortOrder())
                .execute();
        return option.id() != null
                ? option
                : DeliveryOption.builder()
                        .id(id)
                        .registryId(option.registryId())
                        .type(option.type())
                        .label(option.label())
                        .description(option.description())
                        .enabled(option.enabled())
                        .sortOrder(option.sortOrder())
                        .build();
    }

    @Override
    public Optional<DeliveryOption> findById(UUID id) {
        return dsl.selectFrom(DELIVERY_OPTION)
                .where(DELIVERY_OPTION.ID.eq(id))
                .fetchOptional()
                .map(this::toDeliveryOption);
    }

    @Override
    public List<DeliveryOption> findByRegistryId(UUID registryId) {
        return dsl.selectFrom(DELIVERY_OPTION)
                .where(DELIVERY_OPTION.REGISTRY_ID.eq(registryId))
                .orderBy(DELIVERY_OPTION.SORT_ORDER.asc())
                .fetch()
                .map(this::toDeliveryOption);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(DELIVERY_OPTION).where(DELIVERY_OPTION.ID.eq(id)).execute();
    }

    @Override
    public void deleteByRegistryId(UUID registryId) {
        dsl.deleteFrom(DELIVERY_OPTION)
                .where(DELIVERY_OPTION.REGISTRY_ID.eq(registryId))
                .execute();
    }

    private DeliveryOption toDeliveryOption(DeliveryOptionRecord r) {
        return DeliveryOption.builder()
                .id(r.getId())
                .registryId(r.getRegistryId())
                .type(r.getType())
                .label(r.getLabel())
                .description(r.getDescription())
                .enabled(r.getEnabled())
                .sortOrder(r.getSortOrder())
                .build();
    }
}

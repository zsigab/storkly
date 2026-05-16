package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.REGISTRY;
import static app.storkly.domain.generated.Tables.REGISTRY_SUBSCRIPTION;

import app.storkly.domain.generated.tables.records.RegistryRecord;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RegistryRepositoryImpl implements RegistryRepository {

    private final DSLContext dsl;

    @Override
    public Registry save(Registry registry) {
        if (registry.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(REGISTRY)
                    .set(REGISTRY.ID, id)
                    .set(REGISTRY.OWNER_ID, registry.ownerId())
                    .set(REGISTRY.NAME, registry.name())
                    .set(REGISTRY.SLUG, registry.slug())
                    .set(REGISTRY.DESCRIPTION, registry.description())
                    .set(REGISTRY.VISIBILITY, mapVisibility(registry.visibility()))
                    .set(REGISTRY.THEME_COLOR, registry.themeColor())
                    .set(REGISTRY.THEME_BACKGROUND, registry.themeBackground())
                    .set(REGISTRY.CREATED_AT, registry.createdAt())
                    .execute();
            return Registry.builder()
                    .id(id)
                    .ownerId(registry.ownerId())
                    .name(registry.name())
                    .slug(registry.slug())
                    .description(registry.description())
                    .visibility(registry.visibility())
                    .themeColor(registry.themeColor())
                    .themeBackground(registry.themeBackground())
                    .createdAt(registry.createdAt())
                    .build();
        } else {
            dsl.update(REGISTRY)
                    .set(REGISTRY.NAME, registry.name())
                    .set(REGISTRY.SLUG, registry.slug())
                    .set(REGISTRY.DESCRIPTION, registry.description())
                    .set(REGISTRY.VISIBILITY, mapVisibility(registry.visibility()))
                    .set(REGISTRY.THEME_COLOR, registry.themeColor())
                    .set(REGISTRY.THEME_BACKGROUND, registry.themeBackground())
                    .where(REGISTRY.ID.eq(registry.id()))
                    .execute();
            return registry;
        }
    }

    @Override
    public Optional<Registry> findById(UUID id) {
        return dsl.selectFrom(REGISTRY)
                .where(REGISTRY.ID.eq(id))
                .fetchOptional()
                .map(this::toRegistry);
    }

    @Override
    public Optional<Registry> findBySlug(String slug) {
        return dsl.selectFrom(REGISTRY)
                .where(REGISTRY.SLUG.eq(slug))
                .fetchOptional()
                .map(this::toRegistry);
    }

    @Override
    public List<Registry> findByOwnerId(UUID ownerId) {
        return dsl.selectFrom(REGISTRY)
                .where(REGISTRY.OWNER_ID.eq(ownerId))
                .orderBy(REGISTRY.CREATED_AT.desc())
                .fetch()
                .map(this::toRegistry);
    }

    @Override
    public List<Registry> findBySubscriberId(UUID userId) {
        return dsl.select(REGISTRY.fields())
                .from(REGISTRY)
                .join(REGISTRY_SUBSCRIPTION)
                .on(REGISTRY_SUBSCRIPTION.REGISTRY_ID.eq(REGISTRY.ID))
                .where(REGISTRY_SUBSCRIPTION.USER_ID.eq(userId))
                .orderBy(REGISTRY_SUBSCRIPTION.JOINED_AT.desc())
                .fetch()
                .map(r -> toRegistry(r.into(REGISTRY)));
    }

    @Override
    public boolean existsBySlug(String slug) {
        return dsl.fetchCount(REGISTRY, REGISTRY.SLUG.eq(slug)) > 0;
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(REGISTRY).where(REGISTRY.ID.eq(id)).execute();
    }

    private Registry toRegistry(RegistryRecord r) {
        return Registry.builder()
                .id(r.getId())
                .ownerId(r.getOwnerId())
                .name(r.getName())
                .slug(r.getSlug())
                .description(r.getDescription())
                .visibility(mapVisibility(r.getVisibility()))
                .themeColor(r.getThemeColor())
                .themeBackground(r.getThemeBackground())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private app.storkly.domain.generated.enums.RegistryVisibility mapVisibility(RegistryVisibility v) {
        return app.storkly.domain.generated.enums.RegistryVisibility.valueOf(v.name());
    }

    private RegistryVisibility mapVisibility(app.storkly.domain.generated.enums.RegistryVisibility v) {
        return RegistryVisibility.valueOf(v.name());
    }
}

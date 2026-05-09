package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.REGISTRY;
import static app.storkly.domain.generated.Tables.REGISTRY_SLUG_REDIRECT;

import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.domain.registry.SlugRedirectRepository;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class SlugRedirectRepositoryImpl implements SlugRedirectRepository {

    private final DSLContext dsl;

    @Override
    public void save(String oldSlug, UUID registryId) {
        dsl.insertInto(REGISTRY_SLUG_REDIRECT)
                .set(REGISTRY_SLUG_REDIRECT.OLD_SLUG, oldSlug)
                .set(REGISTRY_SLUG_REDIRECT.REGISTRY_ID, registryId)
                .execute();
    }

    @Override
    public Optional<Registry> findRegistryByOldSlug(String oldSlug) {
        return dsl.select(REGISTRY.fields())
                .from(REGISTRY_SLUG_REDIRECT)
                .join(REGISTRY)
                .on(REGISTRY.ID.eq(REGISTRY_SLUG_REDIRECT.REGISTRY_ID))
                .where(REGISTRY_SLUG_REDIRECT.OLD_SLUG.eq(oldSlug))
                .fetchOptional()
                .map(r -> toRegistry(r.into(REGISTRY)));
    }

    private Registry toRegistry(app.storkly.domain.generated.tables.records.RegistryRecord r) {
        return Registry.builder()
                .id(r.getId())
                .ownerId(r.getOwnerId())
                .name(r.getName())
                .slug(r.getSlug())
                .description(r.getDescription())
                .visibility(mapVisibility(r.getVisibility()))
                .createdAt(r.getCreatedAt())
                .build();
    }

    private RegistryVisibility mapVisibility(app.storkly.domain.generated.enums.RegistryVisibility v) {
        return RegistryVisibility.valueOf(v.name());
    }
}

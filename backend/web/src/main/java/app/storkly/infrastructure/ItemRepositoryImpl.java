package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.ITEM;

import app.storkly.domain.generated.tables.records.ItemRecord;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemFlag;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.item.SourceSite;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class ItemRepositoryImpl implements ItemRepository {

    private final DSLContext dsl;

    @Override
    public Item save(Item item) {
        if (item.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(ITEM)
                    .set(ITEM.ID, id)
                    .set(ITEM.REGISTRY_ID, item.registryId())
                    .set(ITEM.CATEGORY_ID, item.categoryId())
                    .set(ITEM.ADDED_BY_USER_ID, item.addedByUserId())
                    .set(ITEM.URL_ORIGINAL, item.urlOriginal())
                    .set(ITEM.SOURCE_SITE, mapSourceSite(item.sourceSite()))
                    .set(ITEM.TITLE, item.title())
                    .set(ITEM.DESCRIPTION, item.description())
                    .set(ITEM.IMAGE_URL, item.imageUrl())
                    .set(ITEM.PRICE_REFERENCE, item.priceReference())
                    .set(ITEM.CURRENCY, item.currency())
                    .set(ITEM.PRICE_CAPTURED_AT, item.priceCapturedAt())
                    .set(ITEM.QUANTITY_DESIRED, item.quantityDesired())
                    .set(ITEM.FLAG, mapFlag(item.flag()))
                    .set(ITEM.NOTES, item.notes())
                    .set(ITEM.SORT_ORDER, item.sortOrder())
                    .set(ITEM.CREATED_AT, item.createdAt())
                    .set(ITEM.UPDATED_AT, item.updatedAt())
                    .execute();
            return Item.builder()
                    .id(id)
                    .registryId(item.registryId())
                    .categoryId(item.categoryId())
                    .addedByUserId(item.addedByUserId())
                    .urlOriginal(item.urlOriginal())
                    .sourceSite(item.sourceSite())
                    .title(item.title())
                    .description(item.description())
                    .imageUrl(item.imageUrl())
                    .priceReference(item.priceReference())
                    .currency(item.currency())
                    .priceCapturedAt(item.priceCapturedAt())
                    .quantityDesired(item.quantityDesired())
                    .flag(item.flag())
                    .notes(item.notes())
                    .sortOrder(item.sortOrder())
                    .createdAt(item.createdAt())
                    .updatedAt(item.updatedAt())
                    .build();
        } else {
            dsl.update(ITEM)
                    .set(ITEM.CATEGORY_ID, item.categoryId())
                    .set(ITEM.URL_ORIGINAL, item.urlOriginal())
                    .set(ITEM.TITLE, item.title())
                    .set(ITEM.DESCRIPTION, item.description())
                    .set(ITEM.IMAGE_URL, item.imageUrl())
                    .set(ITEM.PRICE_REFERENCE, item.priceReference())
                    .set(ITEM.CURRENCY, item.currency())
                    .set(ITEM.QUANTITY_DESIRED, item.quantityDesired())
                    .set(ITEM.FLAG, mapFlag(item.flag()))
                    .set(ITEM.NOTES, item.notes())
                    .set(ITEM.SORT_ORDER, item.sortOrder())
                    .set(ITEM.UPDATED_AT, item.updatedAt())
                    .where(ITEM.ID.eq(item.id()))
                    .execute();
            return item;
        }
    }

    @Override
    public Optional<Item> findById(UUID id) {
        return dsl.selectFrom(ITEM).where(ITEM.ID.eq(id)).fetchOptional().map(this::toItem);
    }

    @Override
    public List<Item> findByRegistryId(UUID registryId) {
        return dsl.selectFrom(ITEM)
                .where(ITEM.REGISTRY_ID.eq(registryId))
                .orderBy(ITEM.SORT_ORDER.asc(), ITEM.CREATED_AT.asc())
                .fetch()
                .map(this::toItem);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(ITEM).where(ITEM.ID.eq(id)).execute();
    }

    private Item toItem(ItemRecord r) {
        return Item.builder()
                .id(r.getId())
                .registryId(r.getRegistryId())
                .categoryId(r.getCategoryId())
                .addedByUserId(r.getAddedByUserId())
                .urlOriginal(r.getUrlOriginal())
                .sourceSite(mapSourceSite(r.getSourceSite()))
                .title(r.getTitle())
                .description(r.getDescription())
                .imageUrl(r.getImageUrl())
                .priceReference(r.getPriceReference())
                .currency(r.getCurrency())
                .priceCapturedAt(r.getPriceCapturedAt())
                .quantityDesired(r.getQuantityDesired())
                .flag(mapFlag(r.getFlag()))
                .notes(r.getNotes())
                .sortOrder(r.getSortOrder())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private app.storkly.domain.generated.enums.SourceSite mapSourceSite(SourceSite s) {
        return app.storkly.domain.generated.enums.SourceSite.valueOf(s.name());
    }

    private SourceSite mapSourceSite(app.storkly.domain.generated.enums.SourceSite s) {
        return SourceSite.valueOf(s.name());
    }

    private app.storkly.domain.generated.enums.ItemFlag mapFlag(ItemFlag f) {
        return app.storkly.domain.generated.enums.ItemFlag.valueOf(f.name());
    }

    private ItemFlag mapFlag(app.storkly.domain.generated.enums.ItemFlag f) {
        return ItemFlag.valueOf(f.name());
    }
}

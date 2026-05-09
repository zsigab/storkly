package app.storkly.infrastructure;

import static app.storkly.domain.generated.Tables.CATEGORY;

import app.storkly.domain.category.Category;
import app.storkly.domain.category.CategoryRepository;
import app.storkly.domain.generated.tables.records.CategoryRecord;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryRepository {

    private final DSLContext dsl;

    @Override
    public Category save(Category category) {
        if (category.id() == null) {
            UUID id = UUID.randomUUID();
            dsl.insertInto(CATEGORY)
                    .set(CATEGORY.ID, id)
                    .set(CATEGORY.REGISTRY_ID, category.registryId())
                    .set(CATEGORY.NAME, category.name())
                    .set(CATEGORY.SORT_ORDER, category.sortOrder())
                    .set(CATEGORY.IS_DEFAULT, category.isDefault())
                    .set(CATEGORY.IS_SYSTEM, false)
                    .execute();
            return Category.builder()
                    .id(id)
                    .registryId(category.registryId())
                    .name(category.name())
                    .sortOrder(category.sortOrder())
                    .isDefault(category.isDefault())
                    .isSystem(false)
                    .build();
        } else {
            dsl.update(CATEGORY)
                    .set(CATEGORY.NAME, category.name())
                    .set(CATEGORY.SORT_ORDER, category.sortOrder())
                    .where(CATEGORY.ID.eq(category.id()))
                    .execute();
            return category;
        }
    }

    @Override
    public Optional<Category> findById(UUID id) {
        return dsl.selectFrom(CATEGORY)
                .where(CATEGORY.ID.eq(id))
                .fetchOptional()
                .map(this::toCategory);
    }

    @Override
    public List<Category> findByRegistryId(UUID registryId) {
        return dsl.selectFrom(CATEGORY)
                .where(CATEGORY.REGISTRY_ID.eq(registryId))
                .orderBy(CATEGORY.SORT_ORDER.asc())
                .fetch()
                .map(this::toCategory);
    }

    @Override
    public List<Category> findSystemCategories() {
        return dsl.selectFrom(CATEGORY)
                .where(CATEGORY.IS_SYSTEM.isTrue())
                .orderBy(CATEGORY.SORT_ORDER.asc())
                .fetch()
                .map(this::toCategory);
    }

    @Override
    public void deleteById(UUID id) {
        dsl.deleteFrom(CATEGORY).where(CATEGORY.ID.eq(id)).execute();
    }

    @Override
    public void updateSortOrders(List<UUID> orderedIds) {
        if (orderedIds.isEmpty()) {
            return;
        }
        dsl.batch(IntStream.range(0, orderedIds.size())
                        .mapToObj(i -> dsl.update(CATEGORY)
                                .set(CATEGORY.SORT_ORDER, i)
                                .where(CATEGORY.ID.eq(orderedIds.get(i))))
                        .toList())
                .execute();
    }

    private Category toCategory(CategoryRecord r) {
        return Category.builder()
                .id(r.getId())
                .registryId(r.getRegistryId())
                .name(r.getName())
                .sortOrder(r.getSortOrder())
                .isDefault(r.getIsDefault())
                .isSystem(r.getIsSystem())
                .build();
    }
}

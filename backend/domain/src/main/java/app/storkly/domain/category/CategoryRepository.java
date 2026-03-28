package app.storkly.domain.category;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository {
    Category save(Category category);

    Optional<Category> findById(UUID id);

    List<Category> findByRegistryId(UUID registryId);

    void deleteById(UUID id);

    void updateSortOrders(List<UUID> orderedIds);
}

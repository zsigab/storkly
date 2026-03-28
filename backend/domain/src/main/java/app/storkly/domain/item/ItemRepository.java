package app.storkly.domain.item;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ItemRepository {
    Item save(Item item);

    Optional<Item> findById(UUID id);

    List<Item> findByRegistryId(UUID registryId);

    void deleteById(UUID id);
}

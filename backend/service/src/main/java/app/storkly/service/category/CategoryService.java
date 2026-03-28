package app.storkly.service.category;

import app.storkly.domain.category.Category;
import app.storkly.domain.category.CategoryRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.CategoryNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final RegistryRepository registryRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;

    public List<Category> findByRegistry(String slug, @Nullable UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        if (registry.visibility() == RegistryVisibility.PRIVATE && currentUserId == null) {
            throw new AccessDeniedException("Registry is private");
        }
        return categoryRepository.findByRegistryId(registry.id());
    }

    @Transactional
    public Category create(String slug, String name, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwnerOrCoOwner(registry, currentUserId);
        List<Category> existing = categoryRepository.findByRegistryId(registry.id());
        int nextSortOrder =
                existing.stream().mapToInt(Category::sortOrder).max().orElse(-1) + 1;
        return categoryRepository.save(Category.builder()
                .registryId(registry.id())
                .name(name)
                .sortOrder(nextSortOrder)
                .isDefault(false)
                .build());
    }

    @Transactional
    public Category update(UUID categoryId, @Nullable String name, UUID currentUserId) {
        Category category =
                categoryRepository.findById(categoryId).orElseThrow(() -> new CategoryNotFoundException(categoryId));
        Registry registry = registryRepository
                .findById(category.registryId())
                .orElseThrow(() ->
                        new RegistryNotFoundException(category.registryId().toString()));
        assertOwnerOrCoOwner(registry, currentUserId);
        return categoryRepository.save(Category.builder()
                .id(category.id())
                .registryId(category.registryId())
                .name(name != null ? name : category.name())
                .sortOrder(category.sortOrder())
                .isDefault(category.isDefault())
                .build());
    }

    @Transactional
    public void delete(UUID categoryId, UUID currentUserId) {
        Category category =
                categoryRepository.findById(categoryId).orElseThrow(() -> new CategoryNotFoundException(categoryId));
        Registry registry = registryRepository
                .findById(category.registryId())
                .orElseThrow(() ->
                        new RegistryNotFoundException(category.registryId().toString()));
        assertOwnerOrCoOwner(registry, currentUserId);
        categoryRepository.deleteById(categoryId);
    }

    @Transactional
    public void reorder(String slug, List<UUID> orderedIds, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwnerOrCoOwner(registry, currentUserId);
        categoryRepository.updateSortOrders(orderedIds);
    }

    private void assertOwnerOrCoOwner(Registry registry, UUID currentUserId) {
        if (!registry.ownerId().equals(currentUserId) && !coOwnerRepository.isCoOwner(registry.id(), currentUserId)) {
            throw new AccessDeniedException("Only the owner or a co-owner can manage categories");
        }
    }
}

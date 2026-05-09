package app.storkly.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.category.Category;
import app.storkly.domain.category.CategoryRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.CategoryNotFoundException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.category.CategoryService;
import app.storkly.service.registry.RegistryAccessService;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private RegistryRepository registryRepository;

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private RegistryAccessService registryAccessService;

    private CategoryService categoryService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();
    private final String slug = "test-registry";

    @BeforeEach
    void setUp() {
        categoryService =
                new CategoryService(categoryRepository, registryRepository, coOwnerRepository, registryAccessService);
    }

    @Test
    void findByRegistry_delegatesReadAccessCheck() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(categoryRepository.findByRegistryId(registryId)).thenReturn(List.of());

        categoryService.findByRegistry(slug, null);

        verify(registryAccessService).assertReadAccess(registry, null);
    }

    @Test
    void create_owner_savesCategory() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(categoryRepository.findByRegistryId(registryId)).thenReturn(List.of());
        Category saved = category(UUID.randomUUID(), "Essentials", 0);
        when(categoryRepository.save(any(Category.class))).thenReturn(saved);

        Category result = categoryService.create(slug, "Essentials", ownerId);

        assertThat(result.name()).isEqualTo("Essentials");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    void create_nonOwner_throwsAccessDenied() {
        UUID stranger = UUID.randomUUID();
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(coOwnerRepository.isCoOwner(registryId, stranger)).thenReturn(false);

        assertThatThrownBy(() -> categoryService.create(slug, "Toys", stranger))
                .isInstanceOf(AccessDeniedException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void update_owner_updatesName() {
        UUID catId = UUID.randomUUID();
        Category existing = category(catId, "Old Name", 0);
        Registry registry = publicRegistry();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        Category updated = category(catId, "New Name", 0);
        when(categoryRepository.save(any(Category.class))).thenReturn(updated);

        Category result = categoryService.update(catId, "New Name", ownerId);

        assertThat(result.name()).isEqualTo("New Name");
    }

    @Test
    void update_unknownCategory_throwsCategoryNotFound() {
        UUID catId = UUID.randomUUID();
        when(categoryRepository.findById(catId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.update(catId, "Name", ownerId))
                .isInstanceOf(CategoryNotFoundException.class);
    }

    @Test
    void delete_owner_deletesCategoryById() {
        UUID catId = UUID.randomUUID();
        Category existing = category(catId, "Essentials", 0);
        Registry registry = publicRegistry();
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));

        categoryService.delete(catId, ownerId);

        verify(categoryRepository).deleteById(catId);
    }

    @Test
    void delete_systemCategory_throwsAccessDenied() {
        UUID catId = UUID.randomUUID();
        Category system = systemCategory(catId, "Nursery & Sleep", 0);
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(system));

        assertThatThrownBy(() -> categoryService.delete(catId, ownerId)).isInstanceOf(AccessDeniedException.class);

        verify(categoryRepository, never()).deleteById(any());
    }

    @Test
    void update_systemCategory_throwsAccessDenied() {
        UUID catId = UUID.randomUUID();
        Category system = systemCategory(catId, "Nursery & Sleep", 0);
        when(categoryRepository.findById(catId)).thenReturn(Optional.of(system));

        assertThatThrownBy(() -> categoryService.update(catId, "Renamed", ownerId))
                .isInstanceOf(AccessDeniedException.class);

        verify(categoryRepository, never()).save(any());
    }

    @Test
    void reorder_owner_callsUpdateSortOrders() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        List<UUID> orderedIds = List.of(UUID.randomUUID(), UUID.randomUUID());

        categoryService.reorder(slug, orderedIds, ownerId);

        verify(categoryRepository).updateSortOrders(orderedIds);
    }

    private Registry publicRegistry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug(slug)
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private Category category(UUID id, String name, int sortOrder) {
        return Category.builder()
                .id(id)
                .registryId(registryId)
                .name(name)
                .sortOrder(sortOrder)
                .isDefault(false)
                .isSystem(false)
                .build();
    }

    private Category systemCategory(UUID id, String name, int sortOrder) {
        return Category.builder()
                .id(id)
                .registryId(null)
                .name(name)
                .sortOrder(sortOrder)
                .isDefault(false)
                .isSystem(true)
                .build();
    }
}

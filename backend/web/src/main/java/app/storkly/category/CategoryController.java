package app.storkly.category;

import app.storkly.category.dto.CategoryCreateRequest;
import app.storkly.category.dto.CategoryReorderRequest;
import app.storkly.category.dto.CategoryResponse;
import app.storkly.category.dto.CategoryUpdateRequest;
import app.storkly.domain.category.Category;
import app.storkly.domain.user.User;
import app.storkly.service.category.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping("/api/registries/{slug}/categories")
    public List<CategoryResponse> list(@PathVariable String slug, @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        return categoryService.findByRegistry(slug, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/api/registries/{slug}/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(
            @PathVariable String slug,
            @RequestBody @Valid CategoryCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return toResponse(categoryService.create(slug, request.name(), currentUser.id()));
    }

    @PatchMapping("/api/categories/{id}")
    public CategoryResponse update(
            @PathVariable UUID id,
            @RequestBody @Valid CategoryUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        return toResponse(categoryService.update(id, request.name(), currentUser.id()));
    }

    @DeleteMapping("/api/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        categoryService.delete(id, currentUser.id());
    }

    @PutMapping("/api/registries/{slug}/categories/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(
            @PathVariable String slug,
            @RequestBody @Valid CategoryReorderRequest request,
            @AuthenticationPrincipal User currentUser) {
        categoryService.reorder(slug, request.orderedIds(), currentUser.id());
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(
                category.id(), category.registryId(), category.name(), category.sortOrder(), category.isDefault(), category.isSystem());
    }
}

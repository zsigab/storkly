package app.storkly.item;

import app.storkly.domain.item.Item;
import app.storkly.domain.user.User;
import app.storkly.item.dto.ItemCreateRequest;
import app.storkly.item.dto.ItemResponse;
import app.storkly.item.dto.ItemUpdateRequest;
import app.storkly.service.item.ItemService;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping("/api/registries/{slug}/items")
    public List<ItemResponse> listByRegistry(
            @PathVariable String slug, @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        return itemService.findByRegistry(slug, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping("/api/registries/{slug}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse create(
            @PathVariable String slug,
            @RequestBody @Valid ItemCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Item item = itemService.create(
                slug,
                request.title(),
                request.description(),
                request.urlOriginal(),
                request.imageUrl(),
                request.priceReference(),
                request.currency(),
                request.categoryId(),
                request.flag(),
                request.quantityDesired(),
                request.notes(),
                request.alreadyOwned(),
                currentUser.id());
        return toResponse(item);
    }

    @GetMapping("/api/items/{id}")
    public ItemResponse get(@PathVariable UUID id, @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        return toResponse(itemService.findById(id, userId));
    }

    @PatchMapping("/api/items/{id}")
    public ItemResponse update(
            @PathVariable UUID id,
            @RequestBody @Valid ItemUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Item item = itemService.update(
                id,
                request.title(),
                request.description(),
                request.urlOriginal(),
                request.imageUrl(),
                request.priceReference(),
                request.currency(),
                request.categoryId(),
                request.flag(),
                request.quantityDesired(),
                request.notes(),
                request.sortOrder(),
                request.alreadyOwned(),
                currentUser.id());
        return toResponse(item);
    }

    @DeleteMapping("/api/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        itemService.delete(id, currentUser.id());
    }

    private ItemResponse toResponse(Item item) {
        return new ItemResponse(
                item.id(),
                item.registryId(),
                item.categoryId(),
                item.addedByUserId(),
                item.urlOriginal(),
                item.sourceSite(),
                item.title(),
                item.description(),
                item.imageUrl(),
                item.priceReference(),
                item.currency(),
                item.priceCapturedAt(),
                item.quantityDesired(),
                item.flag(),
                item.notes(),
                item.sortOrder(),
                item.alreadyOwned(),
                item.createdAt(),
                item.updatedAt());
    }
}

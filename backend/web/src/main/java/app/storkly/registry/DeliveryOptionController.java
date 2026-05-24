package app.storkly.registry;

import app.storkly.domain.item.DeliveryOption;
import app.storkly.domain.user.User;
import app.storkly.registry.dto.DeliveryOptionRequest;
import app.storkly.registry.dto.DeliveryOptionResponse;
import app.storkly.service.item.DeliveryOptionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registries/{slug}/delivery-options")
@RequiredArgsConstructor
public class DeliveryOptionController {

    private final DeliveryOptionService deliveryOptionService;

    @GetMapping
    public List<DeliveryOptionResponse> listByRegistry(@PathVariable String slug) {
        return deliveryOptionService.findBySlug(slug).stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DeliveryOptionResponse create(
            @PathVariable String slug,
            @RequestBody @Valid DeliveryOptionRequest request,
            @AuthenticationPrincipal User currentUser) {
        UUID registryId = deliveryOptionService.resolveRegistryId(slug);
        DeliveryOption option = DeliveryOption.builder()
                .registryId(registryId)
                .type(request.type())
                .label(request.label())
                .description(request.description())
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .eventId(request.eventId())
                .build();
        DeliveryOption saved = deliveryOptionService.save(option, currentUser.id());
        return toResponse(saved);
    }

    @PutMapping("/{id}")
    public DeliveryOptionResponse update(
            @PathVariable String slug,
            @PathVariable UUID id,
            @RequestBody @Valid DeliveryOptionRequest request,
            @AuthenticationPrincipal User currentUser) {
        UUID registryId = deliveryOptionService.resolveRegistryId(slug);
        DeliveryOption option = DeliveryOption.builder()
                .id(id)
                .registryId(registryId)
                .type(request.type())
                .label(request.label())
                .description(request.description())
                .enabled(request.enabled())
                .sortOrder(request.sortOrder())
                .eventId(request.eventId())
                .build();
        DeliveryOption saved = deliveryOptionService.save(option, currentUser.id());
        return toResponse(saved);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug, @PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        deliveryOptionService.delete(id, currentUser.id());
    }

    private DeliveryOptionResponse toResponse(DeliveryOption option) {
        return new DeliveryOptionResponse(
                option.id(),
                option.registryId(),
                option.type(),
                option.label(),
                option.description(),
                option.enabled(),
                option.sortOrder(),
                option.eventId());
    }
}

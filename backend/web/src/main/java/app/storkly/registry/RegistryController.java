package app.storkly.registry;

import app.storkly.domain.registry.Registry;
import app.storkly.domain.user.User;
import app.storkly.registry.dto.CoOwnerRequest;
import app.storkly.registry.dto.JoinRequest;
import app.storkly.registry.dto.RegistryCreateRequest;
import app.storkly.registry.dto.RegistryInviteResponse;
import app.storkly.registry.dto.RegistryResponse;
import app.storkly.registry.dto.RegistryUpdateRequest;
import app.storkly.registry.dto.SubscriberResponse;
import app.storkly.service.registry.RegistryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/registries")
@RequiredArgsConstructor
public class RegistryController {

    private final RegistryService registryService;

    @GetMapping
    public List<RegistryResponse> listMine(@AuthenticationPrincipal User currentUser) {
        List<Registry> owned = registryService.findByOwner(currentUser.id());
        List<Registry> subscribed = registryService.findSubscribed(currentUser.id());
        return Stream.concat(owned.stream(), subscribed.stream())
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegistryResponse create(
            @RequestBody @Valid RegistryCreateRequest request, @AuthenticationPrincipal User currentUser) {
        Registry registry = registryService.create(
                request.name(),
                request.description(),
                request.visibility(),
                request.themeColor(),
                request.themeBackground(),
                currentUser.id(),
                request.contributorAccess());
        return toResponse(registry);
    }

    @GetMapping("/{slug}")
    public RegistryResponse get(@PathVariable String slug, @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        return toResponse(registryService.findBySlug(slug, userId));
    }

    @PatchMapping("/{slug}")
    public RegistryResponse update(
            @PathVariable String slug,
            @RequestBody @Valid RegistryUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Registry registry = registryService.update(
                slug,
                request.name(),
                request.description(),
                request.visibility(),
                request.contributorAccess(),
                request.themeColor(),
                request.themeBackground(),
                currentUser.id());
        return toResponse(registry);
    }

    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        registryService.delete(slug, currentUser.id());
    }

    @PostMapping("/{slug}/invite")
    public RegistryInviteResponse generateInvite(@PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        String token = registryService.generateInvite(slug, currentUser.id());
        return new RegistryInviteResponse(token);
    }

    @PostMapping("/{slug}/join")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void join(
            @PathVariable String slug,
            @RequestBody @Valid JoinRequest request,
            @AuthenticationPrincipal User currentUser) {
        registryService.join(slug, request.token(), currentUser.id());
    }

    @PostMapping("/{slug}/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(@PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        registryService.subscribe(slug, currentUser.id());
    }

    @DeleteMapping("/{slug}/subscription")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(@PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        registryService.unsubscribe(slug, currentUser.id());
    }

    @PostMapping("/{slug}/co-owners")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addCoOwner(
            @PathVariable String slug,
            @RequestBody @Valid CoOwnerRequest request,
            @AuthenticationPrincipal User currentUser) {
        registryService.addCoOwner(slug, request.userId(), currentUser.id());
    }

    @DeleteMapping("/{slug}/co-owners/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCoOwner(
            @PathVariable String slug, @PathVariable UUID userId, @AuthenticationPrincipal User currentUser) {
        registryService.removeCoOwner(slug, userId, currentUser.id());
    }

    @GetMapping("/{slug}/subscribers")
    public List<SubscriberResponse> listSubscribers(
            @PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        return registryService.findSubscribers(slug, currentUser.id()).stream()
                .map(s -> new SubscriberResponse(s.userId(), s.displayName(), s.joinedAt()))
                .toList();
    }

    private RegistryResponse toResponse(Registry registry) {
        return new RegistryResponse(
                registry.id(),
                registry.name(),
                registry.slug(),
                registry.description(),
                registry.visibility(),
                registry.contributorAccess(),
                registry.ownerId(),
                registry.themeColor(),
                registry.themeBackground(),
                registry.createdAt());
    }
}

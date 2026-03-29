package app.storkly.service.registry;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.AlreadySubscribedException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryInvite;
import app.storkly.domain.registry.RegistryInviteRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.util.SlugUtil;
import app.storkly.util.TokenUtil;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistryService {

    private final RegistryRepository registryRepository;
    private final RegistryInviteRepository inviteRepository;
    private final RegistrySubscriptionRepository subscriptionRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;

    @Transactional
    public Registry create(String name, @Nullable String description, RegistryVisibility visibility, UUID ownerId) {
        String slug = generateUniqueSlug(name);
        Registry registry = Registry.builder()
                .ownerId(ownerId)
                .name(name)
                .slug(slug)
                .description(description)
                .visibility(visibility)
                .createdAt(OffsetDateTime.now())
                .build();
        return registryRepository.save(registry);
    }

    public Registry findBySlug(String slug, @Nullable UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));

        if (registry.visibility() == RegistryVisibility.PRIVATE) {
            if (currentUserId == null) {
                throw new AccessDeniedException("Registry is private");
            }
            boolean hasAccess = registry.ownerId().equals(currentUserId)
                    || coOwnerRepository.isCoOwner(registry.id(), currentUserId)
                    || subscriptionRepository.exists(currentUserId, registry.id());
            if (!hasAccess) {
                throw new AccessDeniedException("Registry is private");
            }
        }
        return registry;
    }

    public List<Registry> findByOwner(UUID ownerId) {
        return registryRepository.findByOwnerId(ownerId);
    }

    public List<Registry> findSubscribed(UUID userId) {
        return registryRepository.findBySubscriberId(userId);
    }

    @Transactional
    public Registry update(
            String slug,
            @Nullable String name,
            @Nullable String description,
            @Nullable RegistryVisibility visibility,
            UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwner(registry, currentUserId);
        Registry updated = Registry.builder()
                .id(registry.id())
                .ownerId(registry.ownerId())
                .name(name != null ? name : registry.name())
                .slug(registry.slug())
                .description(description != null ? description : registry.description())
                .visibility(visibility != null ? visibility : registry.visibility())
                .createdAt(registry.createdAt())
                .build();
        return registryRepository.save(updated);
    }

    @Transactional
    public void delete(String slug, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwner(registry, currentUserId);
        registryRepository.deleteById(registry.id());
    }

    @Transactional
    public String generateInvite(String slug, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwner(registry, currentUserId);
        inviteRepository.deleteByRegistryId(registry.id());
        String token = TokenUtil.generate();
        inviteRepository.save(RegistryInvite.builder()
                .registryId(registry.id())
                .token(token)
                .createdAt(OffsetDateTime.now())
                .build());
        log.debug("Generated new invite token for registry slug={}", slug);
        return token;
    }

    @Transactional
    public void join(String slug, String token, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        RegistryInvite invite = inviteRepository
                .findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Invalid invite token"));
        if (!invite.registryId().equals(registry.id())) {
            throw new InvalidTokenException("Invite token does not belong to this registry");
        }
        if (subscriptionRepository.exists(currentUserId, registry.id())) {
            throw new AlreadySubscribedException();
        }
        subscriptionRepository.save(currentUserId, registry.id());
    }

    @Transactional
    public void unsubscribe(String slug, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        subscriptionRepository.delete(currentUserId, registry.id());
    }

    @Transactional
    public void addCoOwner(String slug, UUID userId, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwner(registry, currentUserId);
        coOwnerRepository.add(registry.id(), userId);
    }

    @Transactional
    public void removeCoOwner(String slug, UUID userId, UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertOwner(registry, currentUserId);
        coOwnerRepository.remove(registry.id(), userId);
    }

    private void assertOwner(Registry registry, UUID currentUserId) {
        if (!registry.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the registry owner can perform this action");
        }
    }

    private String generateUniqueSlug(String name) {
        String base = SlugUtil.generate(name);
        String slug = base;
        int suffix = 2;
        while (registryRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}

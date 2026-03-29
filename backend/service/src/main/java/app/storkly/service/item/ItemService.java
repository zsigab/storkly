package app.storkly.service.item;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ItemHasClaimsException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemFlag;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.item.SourceSite;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistrySubscriptionRepository;
import app.storkly.domain.registry.RegistryVisibility;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final ClaimRepository claimRepository;
    private final RegistryRepository registryRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;
    private final RegistrySubscriptionRepository subscriptionRepository;

    public List<Item> findByRegistry(String slug, @Nullable UUID currentUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertReadAccess(registry, currentUserId);
        return itemRepository.findByRegistryId(registry.id());
    }

    public Item findById(UUID id, @Nullable UUID currentUserId) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new ItemNotFoundException(id));
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(item.registryId().toString()));
        assertReadAccess(registry, currentUserId);
        return item;
    }

    @Transactional
    public Item create(
            String slug,
            String title,
            @Nullable String description,
            @Nullable String urlOriginal,
            @Nullable String imageUrl,
            @Nullable BigDecimal priceReference,
            @Nullable String currency,
            @Nullable UUID categoryId,
            ItemFlag flag,
            int quantityDesired,
            @Nullable String notes,
            UUID addedByUserId) {
        Registry registry = registryRepository.findBySlug(slug).orElseThrow(() -> new RegistryNotFoundException(slug));
        assertWriteAccess(registry, addedByUserId);
        List<Item> existing = itemRepository.findByRegistryId(registry.id());
        int nextSortOrder = existing.stream().mapToInt(Item::sortOrder).max().orElse(-1) + 1;
        OffsetDateTime now = OffsetDateTime.now();
        return itemRepository.save(Item.builder()
                .registryId(registry.id())
                .categoryId(categoryId)
                .addedByUserId(addedByUserId)
                .urlOriginal(urlOriginal)
                .sourceSite(SourceSite.MANUAL)
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .priceReference(priceReference)
                .currency(currency)
                .quantityDesired(quantityDesired)
                .flag(flag)
                .notes(notes)
                .sortOrder(nextSortOrder)
                .createdAt(now)
                .updatedAt(now)
                .build());
    }

    @Transactional
    public Item update(
            UUID id,
            @Nullable String title,
            @Nullable String description,
            @Nullable String urlOriginal,
            @Nullable String imageUrl,
            @Nullable BigDecimal priceReference,
            @Nullable String currency,
            @Nullable UUID categoryId,
            @Nullable ItemFlag flag,
            @Nullable Integer quantityDesired,
            @Nullable String notes,
            @Nullable Integer sortOrder,
            UUID currentUserId) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new ItemNotFoundException(id));
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(item.registryId().toString()));
        assertWriteAccess(registry, currentUserId);
        return itemRepository.save(Item.builder()
                .id(item.id())
                .registryId(item.registryId())
                .categoryId(categoryId != null ? categoryId : item.categoryId())
                .addedByUserId(item.addedByUserId())
                .urlOriginal(urlOriginal != null ? urlOriginal : item.urlOriginal())
                .sourceSite(item.sourceSite())
                .title(title != null ? title : item.title())
                .description(description != null ? description : item.description())
                .imageUrl(imageUrl != null ? imageUrl : item.imageUrl())
                .priceReference(priceReference != null ? priceReference : item.priceReference())
                .currency(currency != null ? currency : item.currency())
                .priceCapturedAt(item.priceCapturedAt())
                .quantityDesired(quantityDesired != null ? quantityDesired : item.quantityDesired())
                .flag(flag != null ? flag : item.flag())
                .notes(notes != null ? notes : item.notes())
                .sortOrder(sortOrder != null ? sortOrder : item.sortOrder())
                .createdAt(item.createdAt())
                .updatedAt(OffsetDateTime.now())
                .build());
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        Item item = itemRepository.findById(id).orElseThrow(() -> new ItemNotFoundException(id));
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(item.registryId().toString()));
        assertWriteAccess(registry, currentUserId);
        if (claimRepository.existsActiveByItemId(id)) {
            throw new ItemHasClaimsException(id);
        }
        itemRepository.deleteById(id);
    }

    private void assertReadAccess(Registry registry, @Nullable UUID currentUserId) {
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
    }

    private void assertWriteAccess(Registry registry, UUID currentUserId) {
        if (!registry.ownerId().equals(currentUserId) && !coOwnerRepository.isCoOwner(registry.id(), currentUserId)) {
            throw new AccessDeniedException("Only the owner or a co-owner can manage items");
        }
    }
}

package app.storkly.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ItemHasClaimsException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.PriceReferenceBelowReceivedAmountException;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemFlag;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.item.ItemType;
import app.storkly.domain.item.SourceSite;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.item.ItemService;
import app.storkly.service.registry.RegistryAccessService;
import java.math.BigDecimal;
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
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private RegistryRepository registryRepository;

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private RegistryAccessService registryAccessService;

    private ItemService itemService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();
    private final String slug = "test-registry";

    @BeforeEach
    void setUp() {
        itemService = new ItemService(
                itemRepository, claimRepository, registryRepository, coOwnerRepository, registryAccessService);
    }

    @Test
    void findByRegistry_delegatesReadAccessCheck() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());

        itemService.findByRegistry(slug, null);

        verify(registryAccessService).assertReadAccess(registry, null);
    }

    @Test
    void findById_unknownId_throwsItemNotFound() {
        UUID unknownId = UUID.randomUUID();
        when(itemRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> itemService.findById(unknownId, ownerId)).isInstanceOf(ItemNotFoundException.class);
    }

    @Test
    void create_ownerCanAddItem() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());
        Item saved = item(UUID.randomUUID(), registryId, "Crib", 0);
        when(itemRepository.save(any(Item.class))).thenReturn(saved);

        Item result = itemService.create(
                slug,
                "Crib",
                null,
                null,
                null,
                null,
                null,
                null,
                ItemFlag.EXACT_ONLY,
                1,
                null,
                false,
                ItemType.PRODUCT,
                ownerId);

        assertThat(result.title()).isEqualTo("Crib");
        verify(itemRepository).save(any(Item.class));
    }

    @Test
    void create_nonOwnerThrowsAccessDenied() {
        Registry registry = publicRegistry();
        UUID stranger = UUID.randomUUID();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(coOwnerRepository.isCoOwner(registryId, stranger)).thenReturn(false);

        assertThatThrownBy(() -> itemService.create(
                        slug,
                        "Crib",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        ItemFlag.EXACT_ONLY,
                        1,
                        null,
                        false,
                        ItemType.PRODUCT,
                        stranger))
                .isInstanceOf(AccessDeniedException.class);

        verify(itemRepository, never()).save(any());
    }

    @Test
    void delete_itemWithActiveClaims_throwsItemHasClaimsException() {
        UUID itemId = UUID.randomUUID();
        Item item = item(itemId, registryId, "Crib", 0);
        Registry registry = publicRegistry();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.existsActiveByItemId(itemId)).thenReturn(true);

        assertThatThrownBy(() -> itemService.delete(itemId, ownerId)).isInstanceOf(ItemHasClaimsException.class);

        verify(itemRepository, never()).deleteById(any());
    }

    @Test
    void delete_ownerWithNoClaims_deletesItem() {
        UUID itemId = UUID.randomUUID();
        Item item = item(itemId, registryId, "Crib", 0);
        Registry registry = publicRegistry();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.existsActiveByItemId(itemId)).thenReturn(false);

        itemService.delete(itemId, ownerId);

        verify(itemRepository).deleteById(itemId);
    }

    @Test
    void update_priceReferenceBelowReceivedAmount_throwsException() {
        UUID itemId = UUID.randomUUID();
        Item existing = item(itemId, registryId, "Crib", 0);
        Registry registry = publicRegistry();
        Claim received = Claim.builder()
                .id(UUID.randomUUID())
                .itemId(itemId)
                .claimerName("Alice")
                .claimerEmail("alice@example.com")
                .quantityClaimed(1)
                .amountReceived(new BigDecimal("80.00"))
                .claimToken("tok")
                .claimedAt(OffsetDateTime.now())
                .build();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.findActiveByItemId(itemId)).thenReturn(List.of(received));

        assertThatThrownBy(() -> itemService.update(
                        itemId,
                        null,
                        null,
                        null,
                        null,
                        new BigDecimal("50.00"),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        ownerId))
                .isInstanceOf(PriceReferenceBelowReceivedAmountException.class);

        verify(itemRepository, never()).save(any());
    }

    @Test
    void update_priceReferenceAboveReceivedAmount_succeeds() {
        UUID itemId = UUID.randomUUID();
        Item existing = item(itemId, registryId, "Crib", 0);
        Registry registry = publicRegistry();
        Claim received = Claim.builder()
                .id(UUID.randomUUID())
                .itemId(itemId)
                .claimerName("Alice")
                .claimerEmail("alice@example.com")
                .quantityClaimed(1)
                .amountReceived(new BigDecimal("80.00"))
                .claimToken("tok")
                .claimedAt(OffsetDateTime.now())
                .build();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.findActiveByItemId(itemId)).thenReturn(List.of(received));
        when(itemRepository.save(any(Item.class))).thenReturn(existing);

        itemService.update(
                itemId,
                null,
                null,
                null,
                null,
                new BigDecimal("100.00"),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                ownerId);

        verify(itemRepository).save(any());
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

    private Item item(UUID id, UUID regId, String title, int sortOrder) {
        OffsetDateTime now = OffsetDateTime.now();
        return Item.builder()
                .id(id)
                .registryId(regId)
                .addedByUserId(ownerId)
                .sourceSite(SourceSite.MANUAL)
                .title(title)
                .quantityDesired(1)
                .flag(ItemFlag.EXACT_ONLY)
                .itemType(ItemType.PRODUCT)
                .sortOrder(sortOrder)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}

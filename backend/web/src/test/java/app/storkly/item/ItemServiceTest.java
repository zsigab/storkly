package app.storkly.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRegistryItemRepository;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.event.RsvpRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.exception.ItemHasClaimsException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.PriceReferenceBelowReceivedAmountException;
import app.storkly.domain.exception.QuantityBelowClaimedAmountException;
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
import app.storkly.service.item.ItemWithEvents;
import app.storkly.service.registry.RegistryAccessService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventRegistryItemRepository eventRegistryItemRepository;

    @Mock
    private RsvpRepository rsvpRepository;

    private ItemService itemService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();
    private final String slug = "test-registry";

    @BeforeEach
    void setUp() {
        itemService = new ItemService(
                itemRepository,
                claimRepository,
                registryRepository,
                coOwnerRepository,
                registryAccessService,
                eventRepository,
                eventRegistryItemRepository,
                rsvpRepository);
    }

    @Test
    void findByRegistry_delegatesReadAccessCheck() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());
        when(eventRegistryItemRepository.findAllByRegistryId(registryId)).thenReturn(Map.of());

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
        when(eventRegistryItemRepository.findEventIdsByItemId(saved.id())).thenReturn(List.of());

        ItemWithEvents result = itemService.create(
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
                null,
                ownerId);

        assertThat(result.item().title()).isEqualTo("Crib");
        assertThat(result.linkedEventIds()).isEmpty();
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
                        null,
                        stranger))
                .isInstanceOf(AccessDeniedException.class);

        verify(itemRepository, never()).save(any());
    }

    @Test
    void create_eventItemLinksToEvent() {
        Registry registry = publicRegistry();
        UUID eventId = UUID.randomUUID();
        Event event = event(eventId, ownerId);
        Item saved = item(UUID.randomUUID(), registryId, "Baby shower", 0);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());
        when(itemRepository.save(any(Item.class))).thenReturn(saved);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(eventRegistryItemRepository.findEventIdsByItemId(saved.id())).thenReturn(List.of(eventId));

        ItemWithEvents result = itemService.create(
                slug,
                "Baby shower",
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
                ItemType.EVENT,
                eventId,
                ownerId);

        verify(eventRegistryItemRepository).deleteByItemId(saved.id());
        verify(eventRegistryItemRepository).saveLink(eventId, saved.id());
        assertThat(result.linkedEventIds()).containsExactly(eventId);
    }

    @Test
    void create_eventItemWithUnownedEvent_throwsAccessDenied() {
        Registry registry = publicRegistry();
        UUID eventId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        Event event = event(eventId, otherUserId);
        Item saved = item(UUID.randomUUID(), registryId, "Baby shower", 0);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());
        when(itemRepository.save(any(Item.class))).thenReturn(saved);
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> itemService.create(
                        slug,
                        "Baby shower",
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
                        ItemType.EVENT,
                        eventId,
                        ownerId))
                .isInstanceOf(AccessDeniedException.class);

        verify(eventRegistryItemRepository, never()).saveLink(any(), any());
    }

    @Test
    void create_eventItemWithMissingEvent_throwsEventNotFound() {
        Registry registry = publicRegistry();
        UUID eventId = UUID.randomUUID();
        Item saved = item(UUID.randomUUID(), registryId, "Baby shower", 0);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of());
        when(itemRepository.save(any(Item.class))).thenReturn(saved);
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> itemService.create(
                        slug,
                        "Baby shower",
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
                        ItemType.EVENT,
                        eventId,
                        ownerId))
                .isInstanceOf(EventNotFoundException.class);
    }

    @Test
    void create_eventItemAlreadyOwned_throwsAccessDenied() {
        Registry registry = publicRegistry();
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));

        assertThatThrownBy(() -> itemService.create(
                        slug,
                        "Baby shower",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        ItemFlag.EXACT_ONLY,
                        1,
                        null,
                        true,
                        ItemType.EVENT,
                        null,
                        ownerId))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void findByRegistry_eventItemHiddenForUnauthenticated() {
        Registry registry = publicRegistry();
        Item eventItem = itemOfType(UUID.randomUUID(), registryId, "Shower party", ItemType.EVENT);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of(eventItem));
        when(eventRegistryItemRepository.findAllByRegistryId(registryId))
                .thenReturn(Map.of(eventItem.id(), List.of(UUID.randomUUID())));

        List<ItemWithEvents> results = itemService.findByRegistry(slug, null);

        assertThat(results).isEmpty();
    }

    @Test
    void findByRegistry_eventItemHiddenForNonRsvpUser() {
        Registry registry = publicRegistry();
        UUID viewerId = UUID.randomUUID();
        UUID linkedEventId = UUID.randomUUID();
        Item eventItem = itemOfType(UUID.randomUUID(), registryId, "Shower party", ItemType.EVENT);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of(eventItem));
        when(eventRegistryItemRepository.findAllByRegistryId(registryId))
                .thenReturn(Map.of(eventItem.id(), List.of(linkedEventId)));
        when(coOwnerRepository.isCoOwner(registryId, viewerId)).thenReturn(false);
        when(rsvpRepository.findConfirmedEventIdsByUserId(viewerId)).thenReturn(Set.of());

        List<ItemWithEvents> results = itemService.findByRegistry(slug, viewerId);

        assertThat(results).isEmpty();
    }

    @Test
    void findByRegistry_eventItemVisibleForConfirmedRsvpUser() {
        Registry registry = publicRegistry();
        UUID viewerId = UUID.randomUUID();
        UUID linkedEventId = UUID.randomUUID();
        Item eventItem = itemOfType(UUID.randomUUID(), registryId, "Shower party", ItemType.EVENT);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of(eventItem));
        when(eventRegistryItemRepository.findAllByRegistryId(registryId))
                .thenReturn(Map.of(eventItem.id(), List.of(linkedEventId)));
        when(coOwnerRepository.isCoOwner(registryId, viewerId)).thenReturn(false);
        when(rsvpRepository.findConfirmedEventIdsByUserId(viewerId)).thenReturn(Set.of(linkedEventId));

        List<ItemWithEvents> results = itemService.findByRegistry(slug, viewerId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).item().id()).isEqualTo(eventItem.id());
    }

    @Test
    void findByRegistry_eventItemAlwaysVisibleForOwner() {
        Registry registry = publicRegistry();
        UUID linkedEventId = UUID.randomUUID();
        Item eventItem = itemOfType(UUID.randomUUID(), registryId, "Shower party", ItemType.EVENT);
        when(registryRepository.findBySlug(slug)).thenReturn(Optional.of(registry));
        when(itemRepository.findByRegistryId(registryId)).thenReturn(List.of(eventItem));
        when(eventRegistryItemRepository.findAllByRegistryId(registryId))
                .thenReturn(Map.of(eventItem.id(), List.of(linkedEventId)));

        List<ItemWithEvents> results = itemService.findByRegistry(slug, ownerId);

        assertThat(results).hasSize(1);
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
        when(eventRegistryItemRepository.findEventIdsByItemId(itemId)).thenReturn(List.of());

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
                null,
                ownerId);

        verify(itemRepository).save(any());
    }

    @Test
    void update_quantityBelowTotalClaimed_throwsException() {
        UUID itemId = UUID.randomUUID();
        Item existing = item(itemId, registryId, "Stroller", 0);
        Registry registry = publicRegistry();
        Claim claimed = Claim.builder()
                .id(UUID.randomUUID())
                .itemId(itemId)
                .claimerName("Bob")
                .claimerEmail("bob@example.com")
                .quantityClaimed(3)
                .claimToken("tok")
                .claimedAt(OffsetDateTime.now())
                .build();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.findActiveByItemId(itemId)).thenReturn(List.of(claimed));

        assertThatThrownBy(() -> itemService.update(
                        itemId, null, null, null, null, null, null, null, null, 2, null, null, null, null, null,
                        ownerId))
                .isInstanceOf(QuantityBelowClaimedAmountException.class);

        verify(itemRepository, never()).save(any());
    }

    @Test
    void update_quantityAtOrAboveTotalClaimed_succeeds() {
        UUID itemId = UUID.randomUUID();
        Item existing = item(itemId, registryId, "Stroller", 0);
        Registry registry = publicRegistry();
        Claim claimed = Claim.builder()
                .id(UUID.randomUUID())
                .itemId(itemId)
                .claimerName("Bob")
                .claimerEmail("bob@example.com")
                .quantityClaimed(3)
                .claimToken("tok")
                .claimedAt(OffsetDateTime.now())
                .build();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(existing));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.findActiveByItemId(itemId)).thenReturn(List.of(claimed));
        when(itemRepository.save(any(Item.class))).thenReturn(existing);
        when(eventRegistryItemRepository.findEventIdsByItemId(itemId)).thenReturn(List.of());

        itemService.update(
                itemId, null, null, null, null, null, null, null, null, 3, null, null, null, null, null, ownerId);

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

    private Item itemOfType(UUID id, UUID regId, String title, ItemType type) {
        OffsetDateTime now = OffsetDateTime.now();
        return Item.builder()
                .id(id)
                .registryId(regId)
                .addedByUserId(ownerId)
                .sourceSite(SourceSite.MANUAL)
                .title(title)
                .quantityDesired(1)
                .flag(ItemFlag.EXACT_ONLY)
                .itemType(type)
                .sortOrder(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Event event(UUID id, UUID eventOwnerId) {
        return Event.builder()
                .id(id)
                .ownerId(eventOwnerId)
                .title("Baby Shower")
                .eventDate(OffsetDateTime.now().plusDays(30))
                .rsvpToken("tok-" + id)
                .createdAt(OffsetDateTime.now())
                .build();
    }
}

package app.storkly.item;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ClaimNotFoundException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemFlag;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.item.SourceSite;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.service.email.EmailService;
import app.storkly.service.item.ClaimService;
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
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private RegistryRepository registryRepository;

    @Mock
    private RegistryCoOwnerRepository coOwnerRepository;

    @Mock
    private RegistryAccessService registryAccessService;

    @Mock
    private EmailService emailService;

    private ClaimService claimService;

    private final UUID ownerId = UUID.randomUUID();
    private final UUID registryId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        claimService = new ClaimService(
                claimRepository,
                itemRepository,
                registryRepository,
                coOwnerRepository,
                registryAccessService,
                emailService);
    }

    @Test
    void claim_authenticatedUser_savesClaim() {
        UUID itemId = UUID.randomUUID();
        UUID claimerId = UUID.randomUUID();
        Item item = item(itemId);
        Registry registry = publicRegistry();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        Claim saved = claim(UUID.randomUUID(), itemId, claimerId, null);
        when(claimRepository.save(any(Claim.class))).thenReturn(saved);

        Claim result = claimService.claim(itemId, null, null, 1, null, null, claimerId);

        assertThat(result.claimerUserId()).isEqualTo(claimerId);
        verify(emailService, never()).sendClaimConfirmation(any(), any(), any(), any());
    }

    @Test
    void claim_anonymous_sendsEmailConfirmation() {
        UUID itemId = UUID.randomUUID();
        Item item = item(itemId);
        Registry registry = publicRegistry();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        Claim saved = claim(UUID.randomUUID(), itemId, null, null);
        when(claimRepository.save(any(Claim.class))).thenReturn(saved);

        claimService.claim(itemId, "Alice", "alice@example.com", 1, null, null, null);

        verify(emailService).sendClaimConfirmation(any(), any(), any(), any());
    }

    @Test
    void unclaimByToken_validToken_releasesClaim() {
        UUID claimId = UUID.randomUUID();
        Claim activeClaim = claim(claimId, UUID.randomUUID(), null, null);
        when(claimRepository.findByClaimToken("my-token")).thenReturn(Optional.of(activeClaim));

        claimService.unclaimByToken("my-token");

        verify(claimRepository).release(eq(claimId), any(OffsetDateTime.class));
    }

    @Test
    void unclaimByToken_alreadyReleased_throwsInvalidToken() {
        UUID claimId = UUID.randomUUID();
        Claim released =
                claim(claimId, UUID.randomUUID(), null, OffsetDateTime.now().minusHours(1));
        when(claimRepository.findByClaimToken("used-token")).thenReturn(Optional.of(released));

        assertThatThrownBy(() -> claimService.unclaimByToken("used-token"))
                .isInstanceOf(InvalidTokenException.class)
                .hasMessageContaining("already been released");
    }

    @Test
    void unclaimById_ownClaim_releasesClaim() {
        UUID claimId = UUID.randomUUID();
        UUID claimerId = UUID.randomUUID();
        Claim activeClaim = claim(claimId, UUID.randomUUID(), claimerId, null);
        when(claimRepository.findById(claimId)).thenReturn(Optional.of(activeClaim));

        claimService.unclaimById(claimId, claimerId);

        verify(claimRepository).release(eq(claimId), any(OffsetDateTime.class));
    }

    @Test
    void unclaimById_othersClaim_throwsAccessDenied() {
        UUID claimId = UUID.randomUUID();
        UUID claimerId = UUID.randomUUID();
        UUID stranger = UUID.randomUUID();
        Claim activeClaim = claim(claimId, UUID.randomUUID(), claimerId, null);
        when(claimRepository.findById(claimId)).thenReturn(Optional.of(activeClaim));

        assertThatThrownBy(() -> claimService.unclaimById(claimId, stranger)).isInstanceOf(AccessDeniedException.class);

        verify(claimRepository, never()).release(any(), any());
    }

    @Test
    void findByItem_ownerIsMarkedAsOwnerOrCoOwner() {
        UUID itemId = UUID.randomUUID();
        Item item = item(itemId);
        Registry registry = publicRegistry();
        when(itemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(registryRepository.findById(registryId)).thenReturn(Optional.of(registry));
        when(claimRepository.findActiveByItemId(itemId)).thenReturn(List.of());

        ClaimService.ClaimListView view = claimService.findByItem(itemId, ownerId);

        assertThat(view.viewerIsOwnerOrCoOwner()).isTrue();
    }

    @Test
    void unclaimByToken_unknownToken_throwsClaimNotFound() {
        when(claimRepository.findByClaimToken("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> claimService.unclaimByToken("ghost")).isInstanceOf(ClaimNotFoundException.class);
    }

    private Registry publicRegistry() {
        return Registry.builder()
                .id(registryId)
                .ownerId(ownerId)
                .name("Test")
                .slug("test")
                .visibility(RegistryVisibility.PUBLIC)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private Item item(UUID itemId) {
        OffsetDateTime now = OffsetDateTime.now();
        return Item.builder()
                .id(itemId)
                .registryId(registryId)
                .addedByUserId(ownerId)
                .sourceSite(SourceSite.MANUAL)
                .title("Baby Carrier")
                .quantityDesired(1)
                .flag(ItemFlag.EXACT_ONLY)
                .sortOrder(0)
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private Claim claim(UUID id, UUID itemId, UUID claimerUserId, OffsetDateTime releasedAt) {
        return Claim.builder()
                .id(id)
                .itemId(itemId)
                .claimerUserId(claimerUserId)
                .claimerName("Alice")
                .claimerEmail("alice@example.com")
                .quantityClaimed(1)
                .claimToken("token-" + id)
                .claimedAt(OffsetDateTime.now())
                .releasedAt(releasedAt)
                .build();
    }
}

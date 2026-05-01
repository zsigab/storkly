package app.storkly.service.item;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ClaimNotFoundException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.ItemAlreadyOwnedException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.service.email.EmailService;
import app.storkly.service.registry.RegistryAccessService;
import app.storkly.util.TokenUtil;
import java.math.BigDecimal;
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
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final ItemRepository itemRepository;
    private final RegistryRepository registryRepository;
    private final RegistryCoOwnerRepository coOwnerRepository;
    private final RegistryAccessService registryAccessService;
    private final EmailService emailService;

    public record ClaimListView(List<Claim> claims, boolean viewerIsOwnerOrCoOwner) {}

    @Transactional
    public Claim claim(
            UUID itemId,
            @Nullable String name,
            @Nullable String email,
            int quantityClaimed,
            @Nullable BigDecimal amountContributed,
            @Nullable Integer percentageContributed,
            @Nullable UUID currentUserId) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new ItemNotFoundException(itemId));
        if (item.alreadyOwned()) {
            throw new ItemAlreadyOwnedException();
        }
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(item.registryId().toString()));
        assertReadAccess(registry, currentUserId);

        String claimerName = name != null ? name : "";
        String claimerEmail = email != null ? email : "";
        String token = TokenUtil.generate();
        Claim claim = claimRepository.save(Claim.builder()
                .itemId(itemId)
                .claimerUserId(currentUserId)
                .claimerName(claimerName)
                .claimerEmail(claimerEmail)
                .quantityClaimed(quantityClaimed)
                .amountContributed(amountContributed)
                .percentageContributed(percentageContributed)
                .claimToken(token)
                .claimedAt(OffsetDateTime.now())
                .build());

        if (currentUserId == null) {
            emailService.sendClaimConfirmation(claimerEmail, claimerName, item.title(), token);
        }
        log.debug("Item itemId={} claimed by userId={}", itemId, currentUserId);
        return claim;
    }

    public ClaimListView findByItem(UUID itemId, @Nullable UUID currentUserId) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new ItemNotFoundException(itemId));
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(
                        () -> new RegistryNotFoundException(item.registryId().toString()));
        assertReadAccess(registry, currentUserId);
        boolean isOwnerOrCoOwner = currentUserId != null
                && (registry.ownerId().equals(currentUserId)
                        || coOwnerRepository.isCoOwner(registry.id(), currentUserId));
        return new ClaimListView(claimRepository.findActiveByItemId(itemId), isOwnerOrCoOwner);
    }

    @Transactional
    public void unclaimByToken(String token) {
        Claim claim = claimRepository.findByClaimToken(token).orElseThrow(ClaimNotFoundException::new);
        if (claim.releasedAt() != null) {
            throw new InvalidTokenException("This claim has already been released");
        }
        claimRepository.release(claim.id(), OffsetDateTime.now());
    }

    @Transactional
    public void unclaimById(UUID id, UUID currentUserId) {
        Claim claim = claimRepository.findById(id).orElseThrow(ClaimNotFoundException::new);
        if (claim.releasedAt() != null) {
            throw new InvalidTokenException("This claim has already been released");
        }
        if (claim.claimerUserId() == null || !claim.claimerUserId().equals(currentUserId)) {
            throw new AccessDeniedException("You can only un-claim your own claims");
        }
        claimRepository.release(id, OffsetDateTime.now());
    }

    private void assertReadAccess(Registry registry, @Nullable UUID currentUserId) {
        registryAccessService.assertReadAccess(registry, currentUserId);
    }
}

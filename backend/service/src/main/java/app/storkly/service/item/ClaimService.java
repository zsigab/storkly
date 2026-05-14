package app.storkly.service.item;

import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ClaimNotFoundException;
import app.storkly.domain.exception.ClaimNotReceivedException;
import app.storkly.domain.exception.InvalidTokenException;
import app.storkly.domain.exception.ItemAlreadyOwnedException;
import app.storkly.domain.exception.ItemNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.item.Claim;
import app.storkly.domain.item.ClaimRepository;
import app.storkly.domain.item.MyClaimView;
import app.storkly.domain.item.DeliveryOption;
import app.storkly.domain.item.DeliveryOptionRepository;
import app.storkly.domain.item.Item;
import app.storkly.domain.item.ItemRepository;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryCoOwnerRepository;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.user.User;
import app.storkly.domain.user.UserRepository;
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
    private final UserRepository userRepository;
    private final DeliveryOptionRepository deliveryOptionRepository;
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
            @Nullable UUID deliveryOptionId,
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

        // 100% contribution = full claim: covers the full cost of all desired units
        boolean fullClaimByPercentage = percentageContributed != null && percentageContributed == 100;
        int effectiveQuantity = fullClaimByPercentage ? item.quantityDesired() : quantityClaimed;
        BigDecimal effectiveAmount = fullClaimByPercentage ? null : amountContributed;
        Integer effectivePercentage = fullClaimByPercentage ? null : percentageContributed;

        String deliveryType = null;
        if (deliveryOptionId != null) {
            DeliveryOption option = deliveryOptionRepository
                    .findById(deliveryOptionId)
                    .orElseThrow(() -> new ItemNotFoundException(deliveryOptionId));
            if (!option.registryId().equals(registry.id())) {
                throw new AccessDeniedException("Delivery option does not belong to this registry");
            }
            deliveryType = option.type();
        }

        String claimerName;
        String claimerEmail;
        if (currentUserId != null) {
            User claimerUser =
                    userRepository.findById(currentUserId).orElse(null);
            claimerName = claimerUser != null ? claimerUser.displayName() : "";
            claimerEmail = claimerUser != null ? claimerUser.email() : "";
        } else {
            claimerName = name != null ? name : "";
            claimerEmail = email != null ? email : "";
        }
        String token = TokenUtil.generate();
        OffsetDateTime now = OffsetDateTime.now();
        Claim claim = claimRepository.save(Claim.builder()
                .itemId(itemId)
                .claimerUserId(currentUserId)
                .claimerName(claimerName)
                .claimerEmail(claimerEmail)
                .quantityClaimed(effectiveQuantity)
                .amountContributed(effectiveAmount)
                .percentageContributed(effectivePercentage)
                .claimToken(token)
                .claimedAt(now)
                .deliveryOptionId(deliveryOptionId)
                .deliveryType(deliveryType)
                .confirmedAt(currentUserId != null ? now : null)
                .build());

        if (currentUserId == null) {
            emailService.sendClaimConfirmation(claimerEmail, claimerName, item.title(), token);
        }
        log.debug("Item itemId={} claimed by userId={}", itemId, currentUserId);
        return claim;
    }

    public List<Claim> findActiveByRegistry(String slug, UUID currentUserId) {
        Registry registry = registryRepository
                .findBySlug(slug)
                .orElseThrow(() -> new RegistryNotFoundException(slug));
        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can view the claims dashboard");
        }
        return claimRepository.findActiveByRegistryId(registry.id());
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

    public List<MyClaimView> findMine(UUID currentUserId) {
        return claimRepository.findActiveByUserId(currentUserId);
    }

    @Transactional
    public void confirmByToken(String token) {
        Claim claim = claimRepository.findByClaimToken(token).orElseThrow(ClaimNotFoundException::new);
        if (claim.releasedAt() != null) {
            throw new InvalidTokenException("This claim has already been released");
        }
        if (claim.confirmedAt() != null) {
            return;
        }
        claimRepository.confirm(claim.id(), OffsetDateTime.now());
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
        boolean isClaimer = claim.claimerUserId() != null && claim.claimerUserId().equals(currentUserId);
        if (!isClaimer) {
            Item item = itemRepository.findById(claim.itemId())
                    .orElseThrow(() -> new ItemNotFoundException(claim.itemId()));
            Registry registry = registryRepository.findById(item.registryId())
                    .orElseThrow(() -> new RegistryNotFoundException(item.registryId().toString()));
            boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                    || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
            if (!isOwnerOrCoOwner) {
                throw new AccessDeniedException("You can only un-claim your own claims");
            }
        }
        claimRepository.release(id, OffsetDateTime.now());
    }

    @Transactional
    public void resetById(UUID claimId, UUID currentUserId) {
        Claim claim = claimRepository.findById(claimId).orElseThrow(ClaimNotFoundException::new);
        if (claim.receivedAt() == null) {
            throw new ClaimNotReceivedException();
        }
        if (claim.releasedAt() != null) {
            throw new InvalidTokenException("This claim has already been released");
        }
        Item item = itemRepository.findById(claim.itemId())
                .orElseThrow(() -> new ItemNotFoundException(claim.itemId()));
        Registry registry = registryRepository.findById(item.registryId())
                .orElseThrow(() -> new RegistryNotFoundException(item.registryId().toString()));
        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can reset claims");
        }
        claimRepository.release(claimId, OffsetDateTime.now());
    }

    public List<Claim> findHistoryByItem(UUID itemId, UUID currentUserId) {
        Item item = itemRepository.findById(itemId).orElseThrow(() -> new ItemNotFoundException(itemId));
        Registry registry = registryRepository.findById(item.registryId())
                .orElseThrow(() -> new RegistryNotFoundException(item.registryId().toString()));
        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can view claim history");
        }
        return claimRepository.findAllByItemId(itemId);
    }

    @Transactional
    public void receive(UUID claimId, UUID currentUserId) {
        Claim claim = claimRepository.findById(claimId).orElseThrow(ClaimNotFoundException::new);
        Item item = itemRepository.findById(claim.itemId()).orElseThrow(() -> new ItemNotFoundException(claim.itemId()));
        Registry registry = registryRepository
                .findById(item.registryId())
                .orElseThrow(() -> new RegistryNotFoundException(item.registryId().toString()));

        boolean isOwnerOrCoOwner = registry.ownerId().equals(currentUserId)
                || coOwnerRepository.isCoOwner(registry.id(), currentUserId);
        if (!isOwnerOrCoOwner) {
            throw new AccessDeniedException("Only the registry owner can receive claims");
        }

        claimRepository.receive(claimId, OffsetDateTime.now());
    }

    private void assertReadAccess(Registry registry, @Nullable UUID currentUserId) {
        registryAccessService.assertReadAccess(registry, currentUserId);
    }
}

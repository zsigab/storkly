package app.storkly.item;

import app.storkly.domain.item.Claim;
import app.storkly.domain.user.User;
import app.storkly.item.dto.ClaimRequest;
import app.storkly.item.dto.ClaimResponse;
import app.storkly.item.dto.MyClaimResponse;
import app.storkly.service.item.ClaimService;
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
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping("/api/items/{id}/claims")
    @ResponseStatus(HttpStatus.CREATED)
    public ClaimResponse claim(
            @PathVariable UUID id,
            @RequestBody @Valid ClaimRequest request,
            @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        Claim claim = claimService.claim(
                id,
                request.claimerName(),
                request.claimerEmail(),
                request.quantityClaimed(),
                request.amountContributed(),
                request.percentageContributed(),
                request.deliveryOptionId(),
                userId);
        return toResponse(claim, true);
    }

    @GetMapping("/api/registries/{slug}/claims")
    public List<ClaimResponse> listByRegistry(@PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        return claimService.findActiveByRegistry(slug, currentUser.id()).stream()
                .map(c -> toResponse(c, true))
                .toList();
    }

    @GetMapping("/api/items/{id}/claims")
    public List<ClaimResponse> listByItem(@PathVariable UUID id, @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        ClaimService.ClaimListView view = claimService.findByItem(id, userId);
        return view.claims().stream()
                .map(c -> toResponse(c, view.viewerIsOwnerOrCoOwner()))
                .toList();
    }

    @DeleteMapping("/api/claims/{value}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unclaim(@PathVariable String value, @AuthenticationPrincipal @Nullable User currentUser) {
        try {
            UUID id = UUID.fromString(value);
            if (currentUser == null) {
                throw new app.storkly.domain.exception.AccessDeniedException(
                        "Authentication required to un-claim by ID");
            }
            claimService.unclaimById(id, currentUser.id());
        } catch (IllegalArgumentException e) {
            claimService.unclaimByToken(value);
        }
    }

    @GetMapping("/api/claims/mine")
    public List<MyClaimResponse> mine(@AuthenticationPrincipal User currentUser) {
        return claimService.findMine(currentUser.id()).stream()
                .map(v -> new MyClaimResponse(
                        v.claimId(),
                        v.itemId(),
                        v.itemTitle(),
                        v.registryName(),
                        v.registrySlug(),
                        v.quantityClaimed(),
                        v.amountContributed(),
                        v.percentageContributed(),
                        v.deliveryType(),
                        v.claimedAt()))
                .toList();
    }

    @GetMapping("/api/items/{id}/claim-history")
    public List<ClaimResponse> history(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        return claimService.findHistoryByItem(id, currentUser.id()).stream()
                .map(c -> toResponse(c, true))
                .toList();
    }

    @PostMapping("/api/claims/{token}/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(@PathVariable String token) {
        claimService.confirmByToken(token);
    }

    @PatchMapping("/api/claims/{id}/receive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void receive(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        claimService.receive(id, currentUser.id());
    }

    @PatchMapping("/api/claims/{id}/reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reset(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        claimService.resetById(id, currentUser.id());
    }

    private ClaimResponse toResponse(Claim claim, boolean showClaimerDetails) {
        return new ClaimResponse(
                claim.id(),
                claim.itemId(),
                showClaimerDetails ? claim.claimerUserId() : null,
                showClaimerDetails ? claim.claimerName() : null,
                showClaimerDetails ? claim.claimerEmail() : null,
                claim.quantityClaimed(),
                claim.amountContributed(),
                claim.percentageContributed(),
                claim.claimedAt(),
                claim.confirmedAt(),
                claim.deliveryOptionId(),
                claim.deliveryType(),
                claim.receivedAt(),
                claim.amountReceived(),
                claim.releasedAt());
    }
}

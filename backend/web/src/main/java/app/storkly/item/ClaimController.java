package app.storkly.item;

import app.storkly.domain.item.Claim;
import app.storkly.domain.user.User;
import app.storkly.item.dto.ClaimRequest;
import app.storkly.item.dto.ClaimResponse;
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
                id, request.claimerName(), request.claimerEmail(), request.quantityClaimed(), userId);
        return toResponse(claim, true);
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

    private ClaimResponse toResponse(Claim claim, boolean showClaimerDetails) {
        return new ClaimResponse(
                claim.id(),
                claim.itemId(),
                showClaimerDetails ? claim.claimerUserId() : null,
                showClaimerDetails ? claim.claimerName() : null,
                showClaimerDetails ? claim.claimerEmail() : null,
                claim.quantityClaimed(),
                claim.claimedAt());
    }
}

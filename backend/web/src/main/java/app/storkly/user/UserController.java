package app.storkly.user;

import app.storkly.auth.dto.TokenResponse;
import app.storkly.domain.user.User;
import app.storkly.service.user.UserService;
import app.storkly.user.dto.DisplayNameUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me/display-name")
    public TokenResponse updateDisplayName(
            @AuthenticationPrincipal User user, @RequestBody @Valid DisplayNameUpdateRequest request) {
        User updated = userService.updateDisplayName(user.id(), request.displayName());
        return new TokenResponse(updated.id(), updated.email(), updated.displayName());
    }
}

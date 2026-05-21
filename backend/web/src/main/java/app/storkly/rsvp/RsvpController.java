package app.storkly.rsvp;

import app.storkly.domain.event.Event;
import app.storkly.domain.user.User;
import app.storkly.rsvp.dto.RsvpConfirmResponse;
import app.storkly.rsvp.dto.RsvpPublicEventResponse;
import app.storkly.rsvp.dto.RsvpSubmitRequest;
import app.storkly.service.event.RsvpService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RsvpController {

    private final RsvpService rsvpService;

    @GetMapping("/api/rsvp/{rsvpToken}")
    public RsvpPublicEventResponse getEventInfo(@PathVariable String rsvpToken) {
        Event event = rsvpService.getEventByRsvpToken(rsvpToken);
        return new RsvpPublicEventResponse(event.id(), event.title(), event.eventDate(), event.location());
    }

    @PostMapping("/api/rsvp/{rsvpToken}")
    public void submitRsvp(
            @PathVariable String rsvpToken,
            @RequestBody @Valid RsvpSubmitRequest request,
            @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        String email = currentUser != null ? currentUser.email() : request.email();
        String displayName = currentUser != null ? currentUser.displayName() : request.displayName();
        rsvpService.submitRsvp(rsvpToken, displayName, email, request.attending(), request.captchaToken(), userId);
    }

    @GetMapping("/api/rsvp/confirm/{confirmToken}")
    public RsvpConfirmResponse confirmRsvp(@PathVariable String confirmToken) {
        UUID eventId = rsvpService.confirmRsvp(confirmToken);
        return new RsvpConfirmResponse(eventId.toString());
    }
}

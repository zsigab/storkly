package app.storkly.rsvp;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.user.User;
import app.storkly.event.dto.EventTimeSlotPublicResponse;
import app.storkly.event.dto.LinkedRegistryResponse;
import app.storkly.rsvp.dto.RsvpConfirmResponse;
import app.storkly.rsvp.dto.RsvpPublicEventResponse;
import app.storkly.rsvp.dto.RsvpSubmitRequest;
import app.storkly.service.event.EventService;
import app.storkly.service.event.EventTimeSlotService;
import app.storkly.service.event.RsvpService;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
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
    private final EventTimeSlotService eventTimeSlotService;
    private final EventService eventService;

    @GetMapping("/api/rsvp/{rsvpToken}")
    public RsvpPublicEventResponse getEventInfo(@PathVariable String rsvpToken) {
        Event event = rsvpService.getEventByRsvpToken(rsvpToken);
        List<EventTimeSlot> slots = eventTimeSlotService.findByEventId(event.id());

        List<EventTimeSlotPublicResponse> slotResponses = new ArrayList<>();
        for (EventTimeSlot slot : slots) {
            Integer spotsLeft = null;
            if (slot.capacity() != null && slot.id() != null) {
                spotsLeft = Math.max(0, slot.capacity() - rsvpService.countAttendingBySlot(slot.id()));
            }
            slotResponses.add(
                    new EventTimeSlotPublicResponse(slot.id(), slot.slotTime(), slot.slotOffsetSeconds(), spotsLeft));
        }

        Integer eventSpotsLeft = null;
        if (event.rsvpCapacity() != null) {
            eventSpotsLeft = Math.max(0, event.rsvpCapacity() - rsvpService.countAttendingByEventId(event.id()));
        }

        List<Registry> linkedRegistries = eventService.findLinkedRegistries(event.id(), true);
        List<LinkedRegistryResponse> linkedRegistryResponses = linkedRegistries.stream()
                .map(r -> new LinkedRegistryResponse(r.id(), r.name(), r.slug()))
                .toList();

        return new RsvpPublicEventResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.eventDateOffsetSeconds(),
                event.location(),
                event.description(),
                event.themeColor(),
                event.themeBackground(),
                eventSpotsLeft,
                slotResponses,
                linkedRegistryResponses);
    }

    @PostMapping("/api/rsvp/{rsvpToken}")
    public void submitRsvp(
            @PathVariable String rsvpToken,
            @RequestBody @Valid RsvpSubmitRequest request,
            @AuthenticationPrincipal @Nullable User currentUser) {
        UUID userId = currentUser != null ? currentUser.id() : null;
        String email = currentUser != null ? currentUser.email() : request.email();
        String displayName = currentUser != null ? currentUser.displayName() : request.displayName();
        rsvpService.submitRsvp(
                rsvpToken,
                displayName,
                email,
                request.attending(),
                request.captchaToken(),
                userId,
                request.timeSlotId());
    }

    @GetMapping("/api/rsvp/confirm/{confirmToken}")
    public RsvpConfirmResponse confirmRsvp(@PathVariable String confirmToken) {
        UUID eventId = rsvpService.confirmRsvp(confirmToken);
        return new RsvpConfirmResponse(eventId.toString());
    }
}

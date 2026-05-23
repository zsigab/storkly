package app.storkly.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.event.Rsvp;
import app.storkly.domain.user.User;
import app.storkly.event.dto.EventCreateRequest;
import app.storkly.event.dto.EventPublicResponse;
import app.storkly.event.dto.EventResponse;
import app.storkly.event.dto.EventTimeSlotResponse;
import app.storkly.event.dto.EventUpdateRequest;
import app.storkly.event.dto.RsvpResponse;
import app.storkly.service.event.EventService;
import app.storkly.service.event.EventTimeSlotService;
import app.storkly.service.event.RsvpService;
import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
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
public class EventController {

    private final EventService eventService;
    private final RsvpService rsvpService;
    private final EventTimeSlotService eventTimeSlotService;

    @GetMapping("/api/events")
    public List<EventResponse> list(@AuthenticationPrincipal User currentUser) {
        return eventService.findByOwner(currentUser.id()).stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/api/events/rsvped")
    public List<EventPublicResponse> listRsvped(@AuthenticationPrincipal User currentUser) {
        return rsvpService.findAttendingEventsByUser(currentUser.id()).stream()
                .map(this::toPublicResponse)
                .toList();
    }

    @PostMapping("/api/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse create(
            @RequestBody @Valid EventCreateRequest request, @AuthenticationPrincipal User currentUser) {
        Event event = eventService.create(
                request.title(),
                request.eventDate(),
                request.eventDateOffsetSeconds(),
                request.location(),
                request.description(),
                request.rsvpCapacity(),
                request.themeColor(),
                request.themeBackground(),
                currentUser.id());
        return toResponse(event);
    }

    @GetMapping("/api/events/{id}")
    public EventResponse get(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        Event event = eventService.findById(id, currentUser.id());
        return toResponse(event);
    }

    @PatchMapping("/api/events/{id}")
    public EventResponse update(
            @PathVariable UUID id,
            @RequestBody @Valid EventUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        Event event = eventService.update(
                id,
                request.title(),
                request.eventDate(),
                request.eventDateOffsetSeconds(),
                request.location(),
                request.description(),
                request.rsvpCapacity(),
                request.themeColor(),
                request.themeBackground(),
                currentUser.id());
        return toResponse(event);
    }

    @DeleteMapping("/api/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        eventService.delete(id, currentUser.id());
    }

    @DeleteMapping("/api/events/{id}/rsvps/{rsvpId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRsvp(
            @PathVariable UUID id, @PathVariable UUID rsvpId, @AuthenticationPrincipal User currentUser) {
        rsvpService.deleteRsvp(rsvpId, id, currentUser.id());
    }

    @GetMapping("/api/events/{id}/public")
    public EventPublicResponse getPublic(@PathVariable UUID id) {
        Event event = eventService.findPublicById(id);
        return toPublicResponse(event);
    }

    private EventResponse toResponse(Event event) {
        List<Rsvp> rsvps = rsvpService.getAttendeesByEventId(event.id());
        List<EventTimeSlot> slots = eventTimeSlotService.findByEventId(event.id());

        // Build slot lookups
        Map<UUID, OffsetDateTime> slotTimeById = new HashMap<>();
        Map<UUID, Integer> slotOffsetById = new HashMap<>();
        for (EventTimeSlot slot : slots) {
            if (slot.id() != null) {
                slotTimeById.put(slot.id(), slot.slotTime());
                if (slot.slotOffsetSeconds() != null) {
                    slotOffsetById.put(slot.id(), slot.slotOffsetSeconds());
                }
            }
        }

        // Count attending RSVPs per slot
        Map<UUID, Integer> attendingCountPerSlot = new HashMap<>();
        for (Rsvp rsvp : rsvps) {
            if (rsvp.attending() && rsvp.timeSlotId() != null) {
                attendingCountPerSlot.merge(rsvp.timeSlotId(), 1, Integer::sum);
            }
        }

        List<RsvpResponse> attendees = rsvps.stream()
                .map(rsvp -> new RsvpResponse(
                        rsvp.id(),
                        rsvp.displayName(),
                        rsvp.email(),
                        rsvp.attending(),
                        rsvp.confirmedAt(),
                        rsvp.timeSlotId() != null ? slotTimeById.get(rsvp.timeSlotId()) : null,
                        rsvp.timeSlotId() != null ? slotOffsetById.get(rsvp.timeSlotId()) : null))
                .toList();

        List<EventTimeSlotResponse> timeSlotResponses = new ArrayList<>();
        for (EventTimeSlot slot : slots) {
            int count = slot.id() != null ? attendingCountPerSlot.getOrDefault(slot.id(), 0) : 0;
            timeSlotResponses.add(new EventTimeSlotResponse(
                    slot.id(), slot.slotTime(), slot.slotOffsetSeconds(), slot.capacity(), count));
        }

        return new EventResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.eventDateOffsetSeconds(),
                event.location(),
                event.description(),
                event.rsvpToken(),
                event.rsvpCapacity(),
                attendees,
                timeSlotResponses,
                event.themeColor(),
                event.themeBackground(),
                event.createdAt());
    }

    private EventPublicResponse toPublicResponse(Event event) {
        return new EventPublicResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.eventDateOffsetSeconds(),
                event.location(),
                event.description(),
                event.themeColor(),
                event.themeBackground());
    }
}

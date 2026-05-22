package app.storkly.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.user.User;
import app.storkly.event.dto.EventCreateRequest;
import app.storkly.event.dto.EventPublicResponse;
import app.storkly.event.dto.EventResponse;
import app.storkly.event.dto.EventUpdateRequest;
import app.storkly.event.dto.RsvpResponse;
import app.storkly.service.event.EventService;
import app.storkly.service.event.RsvpService;
import jakarta.validation.Valid;
import java.util.List;
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
                request.location(),
                request.description(),
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
                request.location(),
                request.description(),
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

    @GetMapping("/api/events/{id}/public")
    public EventPublicResponse getPublic(@PathVariable UUID id) {
        Event event = eventService.findPublicById(id);
        return toPublicResponse(event);
    }

    private EventResponse toResponse(Event event) {
        List<RsvpResponse> attendees = rsvpService.getAttendeesByEventId(event.id()).stream()
                .map(rsvp -> new RsvpResponse(
                        rsvp.id(), rsvp.displayName(), rsvp.email(), rsvp.attending(), rsvp.confirmedAt()))
                .toList();
        return new EventResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.location(),
                event.description(),
                event.rsvpToken(),
                attendees,
                event.themeColor(),
                event.themeBackground(),
                event.createdAt());
    }

    private EventPublicResponse toPublicResponse(Event event) {
        return new EventPublicResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.location(),
                event.description(),
                event.themeColor(),
                event.themeBackground());
    }
}

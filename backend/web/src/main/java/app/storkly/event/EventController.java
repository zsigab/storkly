package app.storkly.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.event.Rsvp;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.user.User;
import app.storkly.event.dto.EventCreateRequest;
import app.storkly.event.dto.EventCustomSlugRequest;
import app.storkly.event.dto.EventPublicResponse;
import app.storkly.event.dto.EventRegistryLinksRequest;
import app.storkly.event.dto.EventResponse;
import app.storkly.event.dto.EventSlugLookupResponse;
import app.storkly.event.dto.EventTimeSlotResponse;
import app.storkly.event.dto.EventUpdateRequest;
import app.storkly.event.dto.LinkedRegistryResponse;
import app.storkly.event.dto.RsvpResponse;
import app.storkly.event.dto.RsvpShortLinkLookupResponse;
import app.storkly.event.dto.RsvpShortLinkResponse;
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
import org.springframework.web.bind.annotation.PutMapping;
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
                .map(event -> toResponse(event, eventService.getCustomSlugs(event.id(), currentUser.id())))
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
        return toResponse(event, List.of());
    }

    @GetMapping("/api/events/{id}")
    public EventResponse get(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        Event event = eventService.findById(id, currentUser.id());
        return toResponse(event, eventService.getCustomSlugs(id, currentUser.id()));
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
        return toResponse(event, eventService.getCustomSlugs(id, currentUser.id()));
    }

    @DeleteMapping("/api/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        eventService.delete(id, currentUser.id());
    }

    @PutMapping("/api/events/{id}/registry-links")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateRegistryLinks(
            @PathVariable UUID id,
            @RequestBody @Valid EventRegistryLinksRequest request,
            @AuthenticationPrincipal User currentUser) {
        eventService.updateRegistryLinks(id, request.registryIds(), currentUser.id());
    }

    @DeleteMapping("/api/events/{id}/rsvps/{rsvpId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRsvp(
            @PathVariable UUID id, @PathVariable UUID rsvpId, @AuthenticationPrincipal User currentUser) {
        rsvpService.deleteRsvp(rsvpId, id, currentUser.id());
    }

    @PostMapping("/api/events/{id}/rsvp-link")
    public RsvpShortLinkResponse generateRsvpShortLink(
            @PathVariable UUID id, @AuthenticationPrincipal User currentUser) {
        Event event = eventService.generateRsvpShortCode(id, currentUser.id());
        return new RsvpShortLinkResponse(event.rsvpShortCode());
    }

    @GetMapping("/api/rsvp-link/{code}")
    public RsvpShortLinkLookupResponse lookupRsvpShortLink(@PathVariable String code) {
        Event event = eventService.findByRsvpShortCode(code);
        return new RsvpShortLinkLookupResponse(event.rsvpToken());
    }

    @GetMapping("/api/events/{id}/public")
    public EventPublicResponse getPublic(@PathVariable UUID id) {
        Event event = eventService.findPublicById(id);
        return toPublicResponse(event);
    }

    @PostMapping("/api/events/{id}/custom-slugs")
    @ResponseStatus(HttpStatus.CREATED)
    public void addCustomSlug(
            @PathVariable UUID id,
            @RequestBody @Valid EventCustomSlugRequest request,
            @AuthenticationPrincipal User currentUser) {
        eventService.addCustomSlug(id, request.slug(), currentUser.id());
    }

    @DeleteMapping("/api/events/{id}/custom-slugs/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeCustomSlug(
            @PathVariable UUID id, @PathVariable String slug, @AuthenticationPrincipal User currentUser) {
        eventService.removeCustomSlug(id, slug, currentUser.id());
    }

    @GetMapping("/api/event-slug/{slug}")
    public EventSlugLookupResponse lookupSlug(@PathVariable String slug) {
        Event event = eventService.findEventByCustomSlug(slug);
        return new EventSlugLookupResponse(event.id(), event.rsvpToken());
    }

    private EventResponse toResponse(Event event, List<String> customSlugs) {
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

        List<Registry> linkedRegistries = eventService.findLinkedRegistries(event.id(), false);
        List<LinkedRegistryResponse> linkedRegistryResponses = linkedRegistries.stream()
                .map(r -> new LinkedRegistryResponse(r.id(), r.name(), r.slug()))
                .toList();

        return new EventResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.eventDateOffsetSeconds(),
                event.location(),
                event.description(),
                event.rsvpToken(),
                event.rsvpShortCode(),
                event.rsvpCapacity(),
                attendees,
                timeSlotResponses,
                event.themeColor(),
                event.themeBackground(),
                event.createdAt(),
                linkedRegistryResponses,
                customSlugs);
    }

    private EventPublicResponse toPublicResponse(Event event) {
        List<Registry> linkedRegistries = eventService.findLinkedRegistries(event.id(), false);
        List<LinkedRegistryResponse> linkedRegistryResponses = linkedRegistries.stream()
                .map(r -> new LinkedRegistryResponse(r.id(), r.name(), r.slug()))
                .toList();

        return new EventPublicResponse(
                event.id(),
                event.title(),
                event.eventDate(),
                event.eventDateOffsetSeconds(),
                event.location(),
                event.description(),
                event.themeColor(),
                event.themeBackground(),
                linkedRegistryResponses);
    }
}

package app.storkly.event;

import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.user.User;
import app.storkly.event.dto.EventTimeSlotCreateRequest;
import app.storkly.event.dto.EventTimeSlotResponse;
import app.storkly.event.dto.EventTimeSlotUpdateRequest;
import app.storkly.service.event.EventTimeSlotService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class EventTimeSlotController {

    private final EventTimeSlotService eventTimeSlotService;

    @PostMapping("/api/events/{id}/slots")
    @ResponseStatus(HttpStatus.CREATED)
    public EventTimeSlotResponse addSlot(
            @PathVariable UUID id,
            @RequestBody @Valid EventTimeSlotCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        EventTimeSlot slot = eventTimeSlotService.addSlot(
                id, request.slotTime(), request.slotOffsetSeconds(), request.capacity(), currentUser.id());
        return new EventTimeSlotResponse(slot.id(), slot.slotTime(), slot.slotOffsetSeconds(), slot.capacity(), 0);
    }

    @PutMapping("/api/events/{id}/slots/{slotId}")
    public EventTimeSlotResponse updateSlot(
            @PathVariable UUID id,
            @PathVariable UUID slotId,
            @RequestBody @Valid EventTimeSlotUpdateRequest request,
            @AuthenticationPrincipal User currentUser) {
        EventTimeSlot slot = eventTimeSlotService.updateSlot(
                id, slotId, request.slotTime(), request.slotOffsetSeconds(), request.capacity(), currentUser.id());
        return new EventTimeSlotResponse(slot.id(), slot.slotTime(), slot.slotOffsetSeconds(), slot.capacity(), 0);
    }

    @DeleteMapping("/api/events/{id}/slots/{slotId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSlot(
            @PathVariable UUID id, @PathVariable UUID slotId, @AuthenticationPrincipal User currentUser) {
        eventTimeSlotService.deleteSlot(id, slotId, currentUser.id());
    }
}

package app.storkly.service.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.event.EventTimeSlot;
import app.storkly.domain.event.EventTimeSlotRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.exception.SlotNotFoundException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventTimeSlotService {

    private final EventTimeSlotRepository slotRepository;
    private final EventRepository eventRepository;

    public List<EventTimeSlot> findByEventId(UUID eventId) {
        return slotRepository.findByEventId(eventId);
    }

    @Transactional
    public EventTimeSlot addSlot(UUID eventId, String label, @Nullable Integer capacity, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the event owner can manage time slots");
        }
        EventTimeSlot slot = EventTimeSlot.builder()
                .eventId(eventId)
                .label(label)
                .capacity(capacity)
                .createdAt(OffsetDateTime.now())
                .build();
        return slotRepository.save(slot);
    }

    @Transactional
    public EventTimeSlot updateSlot(
            UUID eventId, UUID slotId, String label, @Nullable Integer capacity, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the event owner can manage time slots");
        }
        EventTimeSlot slot = slotRepository.findById(slotId).orElseThrow(() -> new SlotNotFoundException(slotId));
        if (!slot.eventId().equals(eventId)) {
            throw new SlotNotFoundException(slotId);
        }
        EventTimeSlot updated = EventTimeSlot.builder()
                .id(slot.id())
                .eventId(eventId)
                .label(label)
                .capacity(capacity)
                .createdAt(slot.createdAt())
                .build();
        return slotRepository.save(updated);
    }

    @Transactional
    public void deleteSlot(UUID eventId, UUID slotId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the event owner can manage time slots");
        }
        EventTimeSlot slot = slotRepository.findById(slotId).orElseThrow(() -> new SlotNotFoundException(slotId));
        if (!slot.eventId().equals(eventId)) {
            throw new SlotNotFoundException(slotId);
        }
        slotRepository.deleteById(slotId);
    }
}

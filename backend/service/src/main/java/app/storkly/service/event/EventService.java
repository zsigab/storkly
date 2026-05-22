package app.storkly.service.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.util.TokenUtil;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;

    @Transactional
    public Event create(
            String title,
            OffsetDateTime eventDate,
            @Nullable String location,
            @Nullable String description,
            @Nullable String themeColor,
            @Nullable String themeBackground,
            UUID ownerId) {
        String rsvpToken = TokenUtil.generate();
        Event event = Event.builder()
                .ownerId(ownerId)
                .title(title)
                .eventDate(eventDate)
                .location(location)
                .description(description)
                .rsvpToken(rsvpToken)
                .themeColor(themeColor != null ? themeColor : "peach")
                .themeBackground(themeBackground != null ? themeBackground : "none")
                .createdAt(OffsetDateTime.now())
                .build();
        return eventRepository.save(event);
    }

    public List<Event> findByOwner(UUID ownerId) {
        return eventRepository.findByOwnerId(ownerId);
    }

    public Event findById(UUID id, UUID currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can access this event");
        }
        return event;
    }

    public Event findPublicById(UUID id) {
        return eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
    }

    @Transactional
    public Event update(
            UUID id,
            @Nullable String title,
            @Nullable OffsetDateTime eventDate,
            @Nullable String location,
            @Nullable String description,
            @Nullable String themeColor,
            @Nullable String themeBackground,
            UUID currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can update this event");
        }
        Event updated = Event.builder()
                .id(event.id())
                .ownerId(event.ownerId())
                .title(title != null ? title : event.title())
                .eventDate(eventDate != null ? eventDate : event.eventDate())
                .location(location != null ? location : event.location())
                .description(description != null ? description : event.description())
                .rsvpToken(event.rsvpToken())
                .themeColor(themeColor != null ? themeColor : event.themeColor())
                .themeBackground(themeBackground != null ? themeBackground : event.themeBackground())
                .createdAt(event.createdAt())
                .build();
        return eventRepository.save(updated);
    }

    @Transactional
    public void delete(UUID id, UUID currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can delete this event");
        }
        eventRepository.deleteById(id);
    }
}

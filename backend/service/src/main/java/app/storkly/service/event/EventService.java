package app.storkly.service.event;

import app.storkly.domain.event.Event;
import app.storkly.domain.event.EventCustomSlugRepository;
import app.storkly.domain.event.EventRegistryLinkRepository;
import app.storkly.domain.event.EventRepository;
import app.storkly.domain.exception.AccessDeniedException;
import app.storkly.domain.exception.ConflictException;
import app.storkly.domain.exception.EventNotFoundException;
import app.storkly.domain.exception.RegistryNotFoundException;
import app.storkly.domain.exception.SlugLimitExceededException;
import app.storkly.domain.exception.SlugTakenException;
import app.storkly.domain.registry.Registry;
import app.storkly.domain.registry.RegistryRepository;
import app.storkly.domain.registry.RegistryVisibility;
import app.storkly.util.TokenUtil;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.Nullable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int SHORT_CODE_LENGTH = 6;
    private static final int COLLISION_RETRIES = 5;

    private final EventRepository eventRepository;
    private final EventRegistryLinkRepository eventRegistryLinkRepository;
    private final RegistryRepository registryRepository;
    private final EventCustomSlugRepository eventCustomSlugRepository;

    @Transactional
    public Event create(
            String title,
            OffsetDateTime eventDate,
            @Nullable Integer eventDateOffsetSeconds,
            @Nullable String location,
            @Nullable String description,
            @Nullable Integer rsvpCapacity,
            @Nullable String themeColor,
            @Nullable String themeBackground,
            UUID ownerId) {
        String rsvpToken = TokenUtil.generate();
        Event event = Event.builder()
                .ownerId(ownerId)
                .title(title)
                .eventDate(eventDate)
                .eventDateOffsetSeconds(eventDateOffsetSeconds)
                .location(location)
                .description(description)
                .rsvpToken(rsvpToken)
                .rsvpCapacity(rsvpCapacity)
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
            @Nullable Integer eventDateOffsetSeconds,
            @Nullable String location,
            @Nullable String description,
            @Nullable Integer rsvpCapacity,
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
                .eventDateOffsetSeconds(eventDate != null ? eventDateOffsetSeconds : event.eventDateOffsetSeconds())
                .location(location != null ? location : event.location())
                .description(description != null ? description : event.description())
                .rsvpToken(event.rsvpToken())
                .rsvpCapacity(rsvpCapacity)
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

    @Transactional
    public Event generateRsvpShortCode(UUID id, UUID currentUserId) {
        Event event = eventRepository.findById(id).orElseThrow(() -> new EventNotFoundException(id));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can generate a short code");
        }
        if (event.rsvpShortCode() != null) {
            throw new ConflictException("RSVP short code already generated for this event");
        }

        String shortCode = generateShortCode();
        for (int attempt = 0; attempt < COLLISION_RETRIES; attempt++) {
            try {
                eventRepository.saveShortCode(id, shortCode);
                return Event.builder()
                        .id(event.id())
                        .ownerId(event.ownerId())
                        .title(event.title())
                        .eventDate(event.eventDate())
                        .eventDateOffsetSeconds(event.eventDateOffsetSeconds())
                        .location(event.location())
                        .description(event.description())
                        .rsvpToken(event.rsvpToken())
                        .rsvpShortCode(shortCode)
                        .rsvpCapacity(event.rsvpCapacity())
                        .themeColor(event.themeColor())
                        .themeBackground(event.themeBackground())
                        .createdAt(event.createdAt())
                        .build();
            } catch (DataIntegrityViolationException e) {
                if (attempt < COLLISION_RETRIES - 1) {
                    shortCode = generateShortCode();
                } else {
                    throw e;
                }
            }
        }
        throw new RuntimeException("Failed to generate unique short code after retries");
    }

    public Event findByRsvpShortCode(String rsvpShortCode) {
        return eventRepository.findByRsvpShortCode(rsvpShortCode).orElseGet(() -> {
            Event event = eventCustomSlugRepository
                    .findEventBySlug(rsvpShortCode)
                    .orElseThrow(() -> new EventNotFoundException("Event with short code or slug not found"));
            return event;
        });
    }

    @Transactional
    public void updateRegistryLinks(UUID eventId, List<UUID> registryIds, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can update this event");
        }

        if (!registryIds.isEmpty()) {
            List<Registry> registries = registryRepository.findByIds(registryIds);
            if (registries.size() != registryIds.size()) {
                throw new RegistryNotFoundException("One or more registries not found");
            }
            for (Registry r : registries) {
                if (!r.ownerId().equals(currentUserId)) {
                    throw new AccessDeniedException("All registries must belong to the current user");
                }
            }
        }

        eventRegistryLinkRepository.setLinks(eventId, registryIds);
    }

    public List<Registry> findLinkedRegistries(UUID eventId, boolean excludeHidden) {
        List<UUID> registryIds = eventRegistryLinkRepository.findRegistryIdsByEventId(eventId);
        if (registryIds.isEmpty()) {
            return List.of();
        }

        List<Registry> registries = registryRepository.findByIds(registryIds);
        if (excludeHidden) {
            return registries.stream()
                    .filter(r -> r.visibility() != RegistryVisibility.HIDDEN)
                    .toList();
        }
        return registries;
    }

    @Transactional
    public void addCustomSlug(UUID eventId, String slug, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can add custom slugs");
        }

        List<String> currentSlugs = eventCustomSlugRepository.findSlugsByEventId(eventId);
        if (currentSlugs.size() >= 3) {
            throw new SlugLimitExceededException();
        }

        try {
            eventCustomSlugRepository.save(slug, eventId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new SlugTakenException(slug);
        }
    }

    @Transactional
    public void removeCustomSlug(UUID eventId, String slug, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can remove custom slugs");
        }
        eventCustomSlugRepository.delete(slug);
    }

    public List<String> getCustomSlugs(UUID eventId, UUID currentUserId) {
        Event event = eventRepository.findById(eventId).orElseThrow(() -> new EventNotFoundException(eventId));
        if (!event.ownerId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the owner can view custom slugs");
        }
        return eventCustomSlugRepository.findSlugsByEventId(eventId);
    }

    public Event findEventByCustomSlug(String slug) {
        return eventCustomSlugRepository
                .findEventBySlug(slug)
                .orElseThrow(() -> new EventNotFoundException("Event with slug not found"));
    }

    private String generateShortCode() {
        StringBuilder sb = new StringBuilder(SHORT_CODE_LENGTH);
        for (int i = 0; i < SHORT_CODE_LENGTH; i++) {
            sb.append(CHARSET.charAt(RANDOM.nextInt(CHARSET.length())));
        }
        return sb.toString();
    }
}

package app.storkly.domain.exception;

import java.util.UUID;

public class RsvpNotFoundException extends DomainException {
    public RsvpNotFoundException(UUID id) {
        super("RSVP not found: " + id);
    }
}

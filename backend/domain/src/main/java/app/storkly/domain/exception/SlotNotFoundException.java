package app.storkly.domain.exception;

import java.util.UUID;

public class SlotNotFoundException extends DomainException {
    public SlotNotFoundException(UUID id) {
        super("Time slot not found: " + id);
    }
}

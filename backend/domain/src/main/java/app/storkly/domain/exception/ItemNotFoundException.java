package app.storkly.domain.exception;

import java.util.UUID;

public class ItemNotFoundException extends DomainException {

    public ItemNotFoundException(UUID id) {
        super("Item not found: " + id);
    }
}

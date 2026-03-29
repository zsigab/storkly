package app.storkly.domain.exception;

import java.util.UUID;

public class ItemHasClaimsException extends DomainException {

    public ItemHasClaimsException(UUID itemId) {
        super("Item " + itemId + " cannot be deleted because it has active claims");
    }
}

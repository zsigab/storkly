package app.storkly.domain.exception;

public class ItemAlreadyOwnedException extends DomainException {

    public ItemAlreadyOwnedException() {
        super("This item is already owned and cannot be claimed");
    }
}

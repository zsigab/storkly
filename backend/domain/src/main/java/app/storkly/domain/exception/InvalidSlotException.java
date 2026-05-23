package app.storkly.domain.exception;

public class InvalidSlotException extends DomainException {
    public InvalidSlotException(String message) {
        super(message);
    }
}

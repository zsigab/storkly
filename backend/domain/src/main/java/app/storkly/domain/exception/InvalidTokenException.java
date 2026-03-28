package app.storkly.domain.exception;

public class InvalidTokenException extends DomainException {
    public InvalidTokenException(String message) {
        super(message);
    }
}

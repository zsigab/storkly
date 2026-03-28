package app.storkly.domain.exception;

public class AccessDeniedException extends DomainException {
    public AccessDeniedException(String message) {
        super(message);
    }
}

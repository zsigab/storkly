package app.storkly.domain.exception;

public class UserNotFoundException extends DomainException {
    public UserNotFoundException(String email) {
        super("User not found: " + email);
    }
}

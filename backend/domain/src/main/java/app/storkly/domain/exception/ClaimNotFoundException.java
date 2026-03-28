package app.storkly.domain.exception;

public class ClaimNotFoundException extends DomainException {

    public ClaimNotFoundException() {
        super("Claim not found");
    }
}

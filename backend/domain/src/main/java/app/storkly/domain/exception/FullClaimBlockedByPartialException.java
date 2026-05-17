package app.storkly.domain.exception;

public class FullClaimBlockedByPartialException extends DomainException {

    public FullClaimBlockedByPartialException() {
        super(
                "This item already has partial contributions. Please contribute a specific amount instead of claiming the full item.");
    }
}

package app.storkly.domain.exception;

public class ClaimNotReceivedException extends DomainException {

    public ClaimNotReceivedException() {
        super("This claim has not been marked as received");
    }
}

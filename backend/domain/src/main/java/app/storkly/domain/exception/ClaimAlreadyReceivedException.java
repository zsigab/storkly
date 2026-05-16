package app.storkly.domain.exception;

public class ClaimAlreadyReceivedException extends DomainException {

    public ClaimAlreadyReceivedException() {
        super("This gift has already been received and cannot be un-claimed");
    }
}

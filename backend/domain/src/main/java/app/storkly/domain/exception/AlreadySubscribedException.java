package app.storkly.domain.exception;

public class AlreadySubscribedException extends DomainException {

    public AlreadySubscribedException() {
        super("Already subscribed to this registry");
    }
}

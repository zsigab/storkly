package app.storkly.domain.exception;

public class SubscriberHasClaimsException extends DomainException {

    public SubscriberHasClaimsException() {
        super("Cannot unsubscribe while you have active claims in this registry");
    }
}

package app.storkly.domain.exception;

public class EventAtCapacityException extends DomainException {
    public EventAtCapacityException() {
        super("This event has reached its RSVP capacity");
    }
}

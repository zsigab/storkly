package app.storkly.domain.exception;

public class SlotAtCapacityException extends DomainException {
    public SlotAtCapacityException() {
        super("This time slot has reached its capacity");
    }
}

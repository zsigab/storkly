package app.storkly.domain.exception;

public class QuantityBelowClaimedAmountException extends DomainException {

    public QuantityBelowClaimedAmountException(int totalClaimed) {
        super("Quantity cannot be set below the " + totalClaimed + " already claimed.");
    }
}

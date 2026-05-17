package app.storkly.domain.exception;

import java.math.BigDecimal;

public class PriceReferenceBelowReceivedAmountException extends DomainException {

    public PriceReferenceBelowReceivedAmountException(BigDecimal totalReceived) {
        super("Amount cannot be set below the " + totalReceived.toPlainString() + " already received.");
    }
}

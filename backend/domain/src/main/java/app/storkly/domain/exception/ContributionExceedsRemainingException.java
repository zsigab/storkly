package app.storkly.domain.exception;

import java.math.BigDecimal;

public class ContributionExceedsRemainingException extends DomainException {

    public ContributionExceedsRemainingException(BigDecimal remaining) {
        super("Contribution exceeds the remaining amount. Maximum: " + remaining.toPlainString());
    }

    public ContributionExceedsRemainingException(int remaining) {
        super("Contribution exceeds the remaining percentage. Maximum: " + remaining + "%");
    }
}

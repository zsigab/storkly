package app.storkly.domain.exception;

public class FundContributionRequiredException extends DomainException {

    public FundContributionRequiredException() {
        super("Fund contributions require an amount or percentage");
    }
}

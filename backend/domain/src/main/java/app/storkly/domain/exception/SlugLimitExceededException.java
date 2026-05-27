package app.storkly.domain.exception;

public class SlugLimitExceededException extends ConflictException {
    public SlugLimitExceededException() {
        super("Maximum 3 custom URLs allowed per event");
    }
}

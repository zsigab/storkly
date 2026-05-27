package app.storkly.domain.exception;

public class SlugTakenException extends ConflictException {
    public SlugTakenException(String slug) {
        super("Slug '" + slug + "' is taken and may become available in the future");
    }
}

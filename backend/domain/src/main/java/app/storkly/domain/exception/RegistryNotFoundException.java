package app.storkly.domain.exception;

public class RegistryNotFoundException extends DomainException {

    public RegistryNotFoundException(String slug) {
        super("Registry not found: " + slug);
    }
}

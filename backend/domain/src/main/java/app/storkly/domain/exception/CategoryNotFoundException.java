package app.storkly.domain.exception;

import java.util.UUID;

public class CategoryNotFoundException extends DomainException {

    public CategoryNotFoundException(UUID id) {
        super("Category not found: " + id);
    }
}

package app.storkly.domain.exception;

import java.util.UUID;

public class EventNotFoundException extends DomainException {

  public EventNotFoundException(UUID id) {
    super("Event not found: " + id);
  }
}

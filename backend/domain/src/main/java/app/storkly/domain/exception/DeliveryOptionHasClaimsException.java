package app.storkly.domain.exception;

import java.util.UUID;

public class DeliveryOptionHasClaimsException extends DomainException {

    public DeliveryOptionHasClaimsException(UUID deliveryOptionId) {
        super("Delivery option " + deliveryOptionId + " cannot be removed because claims are associated with it");
    }
}

package app.storkly.item.dto;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record UpdateDeliveryOptionRequest(@Nullable UUID deliveryOptionId) {}

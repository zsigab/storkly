package app.storkly.event.dto;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record EventTimeSlotResponse(
        UUID id, String label, @Nullable Integer capacity, int attendingCount) {}

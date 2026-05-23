package app.storkly.event.dto;

import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record EventTimeSlotPublicResponse(
        UUID id, String label, @Nullable Integer spotsLeft) {}

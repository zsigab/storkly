package app.storkly.rsvp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record RsvpSubmitRequest(
        @NotBlank String displayName,
        @NotBlank String email,
        @NotNull Boolean attending,
        @NotBlank String captchaToken,
        @Nullable UUID timeSlotId) {}

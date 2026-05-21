package app.storkly.rsvp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RsvpSubmitRequest(
        @NotBlank String displayName,
        @NotBlank String email,
        @NotNull Boolean attending,
        @NotBlank String captchaToken) {}

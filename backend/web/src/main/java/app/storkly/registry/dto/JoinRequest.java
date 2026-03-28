package app.storkly.registry.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinRequest(@NotBlank String token) {}

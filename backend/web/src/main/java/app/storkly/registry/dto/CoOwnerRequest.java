package app.storkly.registry.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CoOwnerRequest(@NotNull UUID userId) {}

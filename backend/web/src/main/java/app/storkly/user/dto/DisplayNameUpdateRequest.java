package app.storkly.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DisplayNameUpdateRequest(
        @NotBlank @Size(min = 1, max = 100) String displayName) {}

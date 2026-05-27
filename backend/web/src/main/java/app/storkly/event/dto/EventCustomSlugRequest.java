package app.storkly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EventCustomSlugRequest(
        @NotBlank
        @Size(min = 3, max = 50)
        @Pattern(
                regexp = "^[a-z0-9]([a-z0-9-]*[a-z0-9])?$",
                message =
                        "Slug must be 3-50 characters, lowercase alphanumeric and hyphens, no leading/trailing hyphens")
        String slug) {}

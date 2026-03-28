package app.storkly.category.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryCreateRequest(@NotBlank String name) {}

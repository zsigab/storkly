package app.storkly.linkpreview.dto;

import jakarta.validation.constraints.NotBlank;

public record LinkPreviewRequest(@NotBlank String url) {}

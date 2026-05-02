package app.storkly.scrape.dto;

import jakarta.validation.constraints.NotBlank;

public record ScrapePreviewRequest(@NotBlank String url) {}

package app.storkly.auth.dto;

import java.util.UUID;

public record TokenResponse(UUID id, String email, String displayName) {}

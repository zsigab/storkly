package app.storkly.service.auth;

public record TurnstileRequest(String secret, String response) {}

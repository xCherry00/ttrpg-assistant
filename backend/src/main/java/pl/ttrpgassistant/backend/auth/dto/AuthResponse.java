package pl.ttrpgassistant.backend.auth.dto;

public record AuthResponse(
        String token,
        String role,
        boolean isMg
) {}

package pl.ttrpgassistant.backend.auth.dto;

public record ForgotPasswordResponse(
        String message,
        String resetToken
) {}

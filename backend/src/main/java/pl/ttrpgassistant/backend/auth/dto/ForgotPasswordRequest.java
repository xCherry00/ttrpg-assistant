package pl.ttrpgassistant.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @Email(message = "Email should be valid")
        @NotBlank(message = "Email is required")
        String email
) {}

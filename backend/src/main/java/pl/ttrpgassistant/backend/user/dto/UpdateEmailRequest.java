package pl.ttrpgassistant.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateEmailRequest(
        @Email(message = "Email should be valid")
        @NotBlank(message = "New email is required")
        String newEmail,

        @NotBlank(message = "Current password is required")
        String currentPassword
) {}

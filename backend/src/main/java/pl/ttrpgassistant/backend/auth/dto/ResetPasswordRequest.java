package pl.ttrpgassistant.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Reset token is required")
        String token,

        @NotBlank(message = "New password is required")
        @Size(min = 8, max = 255, message = "New password must be between 8 and 255 characters")
        String newPassword
) {}

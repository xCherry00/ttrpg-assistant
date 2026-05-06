package pl.ttrpgassistant.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TrackToolUsageRequest(
        @NotBlank
        @Size(max = 40)
        @Pattern(regexp = "^[a-z0-9_-]+$", message = "toolKey has invalid format")
        String toolKey
) {}

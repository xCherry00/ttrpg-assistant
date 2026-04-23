package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSessionAttendanceRequest(
        @NotBlank String status
) {}

package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSessionAttendanceRequest(
        @NotBlank String status,
        @Size(max = 1000) String note
) {}

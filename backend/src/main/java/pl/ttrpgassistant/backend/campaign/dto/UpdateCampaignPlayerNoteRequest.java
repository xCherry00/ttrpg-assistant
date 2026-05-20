package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCampaignPlayerNoteRequest(
        @NotBlank @Size(max = 160) String title,
        @NotBlank @Size(max = 10000) String content
) {}

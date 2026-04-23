package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCampaignSessionMessageRequest(
        @NotBlank @Size(max = 2000) String content
) {}

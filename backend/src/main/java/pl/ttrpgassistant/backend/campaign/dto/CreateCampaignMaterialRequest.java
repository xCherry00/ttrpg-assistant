package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCampaignMaterialRequest(
        @NotBlank @Size(max = 40) String type,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String content
) {}

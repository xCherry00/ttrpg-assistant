package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCampaignRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 32) String systemCode,
        @Size(max = 2000) String description,
        @Size(max = 2_000_000) String coverImageUrl
) {}

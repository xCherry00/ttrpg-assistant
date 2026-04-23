package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinCampaignRequest(
        @NotBlank @Size(max = 20) String code
) {}

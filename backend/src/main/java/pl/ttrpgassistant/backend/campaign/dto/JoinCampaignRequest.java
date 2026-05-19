package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record JoinCampaignRequest(
        @NotBlank
        @Size(min = 8, max = 8)
        @Pattern(regexp = "^[A-HJ-NP-Z2-9]{8}$", message = "code must match join code format")
        String code
) {}

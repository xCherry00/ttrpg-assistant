package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotNull;

public record AssignCharacterToCampaignRequest(
        @NotNull Long characterId
) {}

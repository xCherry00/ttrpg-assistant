package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Size;

public record SetParticipantConditionsRequest(
        @Size(max = 1000) String conditions
) {}

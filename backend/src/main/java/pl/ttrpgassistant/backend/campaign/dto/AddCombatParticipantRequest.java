package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record AddCombatParticipantRequest(
        Long characterId,
        @Size(max = 160) String name,
        @Size(max = 30) String participantType,
        @Min(-100) @Max(100) Integer initiativeValue,
        @Min(-100) @Max(100) Integer initiativeModifier,
        @Size(max = 5000) String notes
) {}

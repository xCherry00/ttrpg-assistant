package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record UpdateCombatParticipantRequest(
        @Size(max = 160) String name,
        @Min(-100) @Max(100) Integer initiativeValue,
        @Min(-100) @Max(100) Integer initiativeModifier,
        Boolean isActive,
        Boolean isDefeated,
        @Size(max = 5000) String notes
) {}

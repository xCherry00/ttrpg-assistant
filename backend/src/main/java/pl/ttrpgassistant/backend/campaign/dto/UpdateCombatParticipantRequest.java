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
        @Size(max = 5000) String notes,
        @Min(0) Integer maxHp,
        @Min(0) Integer currentHp,
        @Min(0) Integer tempHp,
        @Min(0) Integer armorClass,
        @Size(max = 1000) String conditions,
        @Min(0) @Max(3) Integer deathSaveSuccesses,
        @Min(0) @Max(3) Integer deathSaveFailures
) {}

package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCombatEncounterRequest(
        Long sessionId,
        @NotBlank @Size(max = 160) String name,
        @NotBlank @Size(max = 40) String systemCode
) {}

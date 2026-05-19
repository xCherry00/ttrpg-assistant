package pl.ttrpgassistant.backend.campaign.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDiceRollRequest(
        Long sessionId,
        Long encounterId,
        Long participantId,
        Long characterId,
        @Size(max = 160) String rollLabel,
        @NotBlank @Size(max = 120) String rollExpression,
        @Size(max = 40) String rollType,
        Boolean isPrivate
) {}

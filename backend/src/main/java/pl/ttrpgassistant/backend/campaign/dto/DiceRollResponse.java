package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record DiceRollResponse(
        Long id,
        Long campaignId,
        Long sessionId,
        Long encounterId,
        Long participantId,
        Long characterId,
        Long rolledByUserId,
        String rolledByUsername,
        String rollLabel,
        String rollExpression,
        String rollType,
        Integer total,
        String diceResults,
        Integer modifier,
        boolean isPrivate,
        Instant createdAt
) {}

package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record RequestedRollResponse(
        Long id,
        Long campaignId,
        Long sessionId,
        Long targetUserId,
        Long targetCharacterId,
        String targetName,
        String characterName,
        Long requestedByUserId,
        Long fulfilledRollId,
        String rollLabel,
        String rollType,
        String rollExpression,
        String abilityKey,
        String skillKey,
        boolean dcVisible,
        Integer dc,
        boolean isDcHidden,
        boolean showSuccessToPlayer,
        String status,
        Integer resultTotal,
        Boolean success,
        Instant createdAt,
        Instant resolvedAt
) {}

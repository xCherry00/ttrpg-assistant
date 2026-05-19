package pl.ttrpgassistant.backend.campaign.dto;

import java.util.List;

public record CombatEncounterResponse(
        Long id,
        Long campaignId,
        Long sessionId,
        String name,
        String systemCode,
        String status,
        Integer roundNumber,
        Integer currentTurnIndex,
        Long currentParticipantId,
        List<CombatParticipantResponse> participants
) {}

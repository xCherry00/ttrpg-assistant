package pl.ttrpgassistant.backend.campaign.dto;

public record CombatParticipantResponse(
        Long id,
        Long characterId,
        String name,
        String participantType,
        Integer initiativeValue,
        Integer initiativeModifier,
        Integer sortOrder,
        boolean isActive,
        boolean isDefeated,
        String notes
) {}

package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignCharacterResponse(
        Long campaignId,
        Long characterId,
        String characterName,
        String systemCode,
        String raceName,
        String className,
        String backgroundName,
        Integer level,
        String portraitUrl,
        Long userId,
        String role,
        Instant assignedAt,
        boolean isActive
) {}

package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record SessionLiveStateResponse(
        Long campaignId,
        Long sessionId,
        String sceneTitle,
        String sceneImageUrl,
        String sceneDescription,
        Long activeEncounterId,
        Instant updatedAt
) {}

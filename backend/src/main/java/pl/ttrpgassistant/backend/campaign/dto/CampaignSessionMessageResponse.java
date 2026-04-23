package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignSessionMessageResponse(
        Long id,
        Long authorUserId,
        String authorDisplayName,
        String authorHandle,
        String authorNickColor,
        boolean self,
        String content,
        Instant createdAt
) {}

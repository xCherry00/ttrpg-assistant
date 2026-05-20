package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignPlayerNoteResponse(
        Long id,
        Long campaignId,
        Long userId,
        String username,
        String displayName,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt
) {}

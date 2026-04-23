package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignSummaryResponse(
        Long id,
        String title,
        String systemCode,
        String description,
        String coverImageUrl,
        String status,
        String inviteCode,
        String inviteLink,
        String myRole,
        boolean owner,
        Instant createdAt,
        Instant updatedAt
) {}

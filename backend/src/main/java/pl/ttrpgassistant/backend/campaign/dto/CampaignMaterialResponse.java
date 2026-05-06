package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignMaterialResponse(
        Long id,
        String type,
        String title,
        String content,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}

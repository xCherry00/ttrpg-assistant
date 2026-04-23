package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignNotificationResponse(
        Long id,
        String type,
        String message,
        boolean read,
        Instant createdAt
) {}

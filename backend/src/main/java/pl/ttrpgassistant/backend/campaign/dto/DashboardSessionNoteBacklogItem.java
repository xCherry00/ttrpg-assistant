package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record DashboardSessionNoteBacklogItem(
        Long campaignId,
        String campaignTitle,
        Long sessionId,
        String sessionTitle,
        Instant scheduledAt,
        Instant finishedAt,
        Instant statusUpdatedAt,
        String status
) {}

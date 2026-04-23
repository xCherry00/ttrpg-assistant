package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignSessionSummaryResponse(
        Long id,
        String title,
        String description,
        String status,
        Instant scheduledFor,
        Instant startedAt,
        Instant finishedAt,
        String myAttendance,
        int yesCount,
        int maybeCount,
        int noCount,
        int messageCount,
        Instant createdAt,
        Instant updatedAt
) {}

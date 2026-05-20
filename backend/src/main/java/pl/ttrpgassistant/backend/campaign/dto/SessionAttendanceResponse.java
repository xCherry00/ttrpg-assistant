package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record SessionAttendanceResponse(
        Long id,
        Long campaignId,
        Long sessionId,
        Long userId,
        String username,
        String displayName,
        String status,
        String note,
        boolean self,
        Instant updatedAt
) {}

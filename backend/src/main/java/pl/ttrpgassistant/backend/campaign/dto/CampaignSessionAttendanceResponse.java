package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignSessionAttendanceResponse(
        Long userId,
        String displayName,
        String username,
        Integer tagCode,
        String status,
        boolean self,
        Instant updatedAt
) {}

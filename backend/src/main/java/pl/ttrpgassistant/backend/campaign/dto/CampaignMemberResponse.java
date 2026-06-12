package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignMemberResponse(
        Long id,
        String displayName,
        String username,
        Integer tagCode,
        String handle,
        String avatarUrl,
        String role,
        boolean owner,
        boolean mg,
        boolean self,
        boolean online,
        String activityLabel,
        Instant lastActiveAt,
        Instant joinedAt
) {}

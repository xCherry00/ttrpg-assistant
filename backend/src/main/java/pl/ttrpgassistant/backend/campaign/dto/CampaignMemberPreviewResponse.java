package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record CampaignMemberPreviewResponse(
        Long id,
        String displayName,
        String username,
        String handle,
        String avatarUrl,
        String role,
        boolean owner,
        boolean mg,
        boolean online,
        String activityLabel,
        Instant lastActiveAt
) {}

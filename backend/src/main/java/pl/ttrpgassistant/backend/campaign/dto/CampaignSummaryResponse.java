package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;
import java.util.List;

public record CampaignSummaryResponse(
        Long id,
        String title,
        String systemCode,
        String description,
        String coverImageUrl,
        String bannerImageUrl,
        String status,
        String inviteCode,
        String inviteLink,
        String myRole,
        boolean owner,
        String visibility,
        int playerLimit,
        long playerCount,
        String gmName,
        boolean saved,
        List<CampaignMemberPreviewResponse> members,
        String lastFinishedSessionTitle,
        Instant lastFinishedSessionAt,
        Instant createdAt,
        Instant updatedAt
) {}

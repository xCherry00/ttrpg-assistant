package pl.ttrpgassistant.backend.social.dto;

import java.time.Instant;

public record SocialUserCardResponse(
        Long id,
        String handle,
        String username,
        Integer tagCode,
        String displayName,
        String avatarUrl,
        String profileBannerUrl,
        String bio,
        String favoriteSystem,
        String role,
        boolean isMg,
        boolean online,
        String activityLabel,
        Instant lastActiveAt,
        String relationship,
        long sharedCampaignsCount,
        String suggestionReason,
        long mutualFriendsCount
) {}

package pl.ttrpgassistant.backend.social.dto;

public record SocialUserCardResponse(
        Long id,
        String handle,
        String username,
        Integer tagCode,
        String displayName,
        String bio,
        String favoriteSystem,
        String role,
        boolean isMg,
        String activityLabel,
        String relationship,
        long sharedCampaignsCount
) {}

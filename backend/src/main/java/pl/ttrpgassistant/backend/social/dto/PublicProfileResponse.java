package pl.ttrpgassistant.backend.social.dto;

public record PublicProfileResponse(
        SocialUserCardResponse user,
        long friendsCount,
        long campaignsCount,
        long ownedCampaignsCount
) {}

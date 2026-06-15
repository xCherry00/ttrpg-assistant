package pl.ttrpgassistant.backend.social.dto;

import java.util.List;

public record PublicProfileResponse(
        SocialUserCardResponse user,
        long friendsCount,
        long campaignsCount,
        long ownedCampaignsCount,
        List<PublicProfileCampaignResponse> sharedCampaigns,
        List<SocialUserCardResponse> mutualFriends
) {}

package pl.ttrpgassistant.backend.social.dto;

import java.util.List;

public record SocialOverviewResponse(
        List<SocialUserCardResponse> friends,
        List<SocialRequestResponse> incomingRequests,
        List<SocialRequestResponse> outgoingRequests,
        List<SocialUserCardResponse> suggestions,
        List<SocialUserCardResponse> blockedUsers
) {}

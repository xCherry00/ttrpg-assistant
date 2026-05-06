package pl.ttrpgassistant.backend.campaign.dto;

public record CampaignFriendCandidateResponse(
        Long id,
        String displayName,
        String username,
        Integer tagCode,
        String handle
) {}

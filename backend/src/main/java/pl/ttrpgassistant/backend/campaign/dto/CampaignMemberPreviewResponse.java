package pl.ttrpgassistant.backend.campaign.dto;

public record CampaignMemberPreviewResponse(
        Long id,
        String displayName,
        String username,
        String handle,
        String role,
        boolean owner,
        boolean mg
) {}

package pl.ttrpgassistant.backend.campaign.dto;

public record JoinCampaignResponse(
        CampaignSummaryResponse campaign,
        boolean joinedNow,
        String message
) {}

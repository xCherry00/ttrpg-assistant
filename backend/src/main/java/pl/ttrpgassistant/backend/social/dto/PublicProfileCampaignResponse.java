package pl.ttrpgassistant.backend.social.dto;

public record PublicProfileCampaignResponse(
        Long id,
        String title,
        String systemCode,
        String coverImageUrl,
        String bannerImageUrl,
        String role
) {}

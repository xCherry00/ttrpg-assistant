package pl.ttrpgassistant.backend.messages.dto;

public record MessageUserPreviewResponse(
        long id,
        String handle,
        String username,
        int tagCode,
        String displayName,
        String avatarUrl,
        String profileBannerUrl,
        String activityLabel
) {
}

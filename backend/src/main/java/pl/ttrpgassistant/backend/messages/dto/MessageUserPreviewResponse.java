package pl.ttrpgassistant.backend.messages.dto;

import java.time.Instant;

public record MessageUserPreviewResponse(
        long id,
        String handle,
        String username,
        int tagCode,
        String displayName,
        String avatarUrl,
        String profileBannerUrl,
        boolean online,
        String activityLabel,
        Instant lastActiveAt
) {
}

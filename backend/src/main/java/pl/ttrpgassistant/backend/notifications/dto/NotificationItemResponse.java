package pl.ttrpgassistant.backend.notifications.dto;

import java.time.Instant;

public record NotificationItemResponse(
        String id,
        String source,
        String type,
        String title,
        String message,
        boolean read,
        Instant createdAt,
        String targetUrl
) {
}

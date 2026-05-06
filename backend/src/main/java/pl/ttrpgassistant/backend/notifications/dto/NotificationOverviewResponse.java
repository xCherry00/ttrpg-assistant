package pl.ttrpgassistant.backend.notifications.dto;

import java.util.List;

public record NotificationOverviewResponse(
        long unreadCount,
        List<NotificationItemResponse> items
) {
}

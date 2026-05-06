package pl.ttrpgassistant.backend.messages.dto;

import java.time.Instant;

public record MessageConversationSummaryResponse(
        long id,
        String type,
        String status,
        MessageUserPreviewResponse peer,
        String title,
        String lastMessagePreview,
        Long lastMessageSenderUserId,
        Instant lastMessageAt,
        long unreadCount
) {
}

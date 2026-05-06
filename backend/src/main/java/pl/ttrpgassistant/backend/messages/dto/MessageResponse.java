package pl.ttrpgassistant.backend.messages.dto;

import java.time.Instant;
import java.util.List;

public record MessageResponse(
        long id,
        long conversationId,
        long senderUserId,
        String senderDisplayName,
        String senderHandle,
        boolean own,
        String content,
        Instant createdAt,
        List<MessageAttachmentResponse> attachments
) {
}

package pl.ttrpgassistant.backend.campaign.dto;

import java.time.Instant;

public record SessionPlayerNoteResponse(
        Long id,
        Long campaignId,
        Long sessionId,
        Long userId,
        String title,
        String content,
        Instant createdAt,
        Instant updatedAt
) {}

package pl.ttrpgassistant.backend.notes.dto;

import pl.ttrpgassistant.backend.notes.UserNoteType;

import java.time.Instant;

public record UserNoteResponse(
        Long id,
        String title,
        UserNoteType type,
        String content,
        Long campaignId,
        String campaignName,
        Long characterId,
        String characterName,
        Instant createdAt,
        Instant updatedAt
) {}

package pl.ttrpgassistant.backend.character.dto;

import java.time.Instant;

public record CharacterImportResponse(
        Long characterId,
        String name,
        String systemCode,
        Instant createdAt
) {}

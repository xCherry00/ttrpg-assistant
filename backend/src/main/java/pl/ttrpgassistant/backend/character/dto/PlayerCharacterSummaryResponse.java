package pl.ttrpgassistant.backend.character.dto;

import java.time.Instant;

public record PlayerCharacterSummaryResponse(
        Long id,
        String systemCode,
        String name,
        String status,
        Integer level,
        String raceName,
        String className,
        String portraitUrl,
        Instant updatedAt
) {}

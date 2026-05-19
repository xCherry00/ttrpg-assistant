package pl.ttrpgassistant.backend.character.dto;

import java.time.Instant;
import java.util.Map;

public record PlayerCharacterDetailsResponse(
        Long id,
        String systemCode,
        String name,
        String status,
        String portraitUrl,
        String raceName,
        String className,
        String backgroundName,
        Integer level,
        Integer currentHp,
        Integer tempHp,
        String privateNotes,
        Map<String, Object> sheetJson,
        Instant createdAt,
        Instant updatedAt
) {}

package pl.ttrpgassistant.backend.character.dto;

import java.time.Instant;
import java.util.Map;

public record CharacterExportResponse(
        String exportVersion,
        Instant exportedAt,
        CharacterExportPayload character
) {
    public record CharacterExportPayload(
            Long id,
            String name,
            String systemCode,
            String status,
            String raceName,
            String className,
            String backgroundName,
            Integer level,
            Integer maxHp,
            Integer currentHp,
            Integer tempHp,
            String privateNotes,
            String portraitUrl,
            Map<String, Object> sheetJson,
            Map<String, Object> metadata,
            Instant createdAt,
            Instant updatedAt
    ) {}
}

package pl.ttrpgassistant.backend.character.dto;

import java.time.Instant;
import java.util.Map;

public record CharacterExportResponse(
        String exportVersion,
        Instant exportedAt,
        CharacterExportPayload character
) {
    public record CharacterExportPayload(
            String name,
            String systemCode,
            String raceName,
            String className,
            String backgroundName,
            Integer level,
            String portraitUrl,
            Map<String, Object> sheetJson,
            Map<String, Object> metadata
    ) {}
}

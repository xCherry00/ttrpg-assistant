package pl.ttrpgassistant.backend.generator.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record GeneratorResultResponse(
        String type,
        String system,
        String title,
        Map<String, Object> payload,
        String source,
        OffsetDateTime generatedAt
) {}

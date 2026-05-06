package pl.ttrpgassistant.backend.generator.dto;

import java.time.OffsetDateTime;

public record GeneratorRecentResultResponse(
        Long id,
        String generatorCode,
        String variantCode,
        String title,
        String summary,
        OffsetDateTime createdAt
) {}

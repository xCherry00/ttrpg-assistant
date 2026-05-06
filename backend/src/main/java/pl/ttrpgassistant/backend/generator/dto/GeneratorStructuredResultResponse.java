package pl.ttrpgassistant.backend.generator.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record GeneratorStructuredResultResponse(
        Long id,
        String generatorCode,
        String variantCode,
        String title,
        String subtitle,
        List<GeneratorOutputSection> sections,
        String source,
        OffsetDateTime generatedAt
) {}

package pl.ttrpgassistant.backend.generator.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record GeneratorTemplateResponse(
        Long id,
        String name,
        String generatorCode,
        String variantCode,
        Map<String, Object> config,
        OffsetDateTime createdAt
) {}

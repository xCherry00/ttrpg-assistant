package pl.ttrpgassistant.backend.generator.dto;

import java.util.Map;

public record CreateGeneratorTemplateRequest(
        String name,
        String generatorCode,
        String variantCode,
        Map<String, Object> config
) {}

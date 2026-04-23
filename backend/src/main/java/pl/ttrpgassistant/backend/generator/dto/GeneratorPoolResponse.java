package pl.ttrpgassistant.backend.generator.dto;

import java.util.Map;

public record GeneratorPoolResponse(
        String type,
        String system,
        Map<String, Object> data
) {}

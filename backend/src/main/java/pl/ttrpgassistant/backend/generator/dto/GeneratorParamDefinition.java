package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorParamDefinition(
        String key,
        String label,
        String inputType,
        List<String> options,
        Integer min,
        Integer max,
        Object defaultValue
) {}

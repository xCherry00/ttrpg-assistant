package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorFormFieldResponse(
        String key,
        String label,
        String type,
        List<String> options,
        Object defaultValue,
        boolean required,
        int orderIndex
) {}

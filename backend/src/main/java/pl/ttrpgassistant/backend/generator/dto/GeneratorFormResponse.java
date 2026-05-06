package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorFormResponse(
        String generatorCode,
        String variantCode,
        String name,
        String description,
        List<GeneratorFormFieldResponse> fields
) {}

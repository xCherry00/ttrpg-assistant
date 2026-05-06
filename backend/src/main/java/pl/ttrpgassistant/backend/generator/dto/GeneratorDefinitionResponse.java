package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorDefinitionResponse(
        String code,
        String name,
        String description,
        String category,
        String icon,
        List<GeneratorVariantResponse> variants
) {}

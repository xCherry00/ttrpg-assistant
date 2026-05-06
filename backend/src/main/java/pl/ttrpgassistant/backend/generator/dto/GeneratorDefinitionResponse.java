package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorDefinitionResponse(
        String code,
        String name,
        String description,
        String category,
        String icon,
        String categoryCode,
        String typeCode,
        List<String> genreTags,
        List<String> systemTags,
        List<String> toneTags,
        int displayOrder,
        String iconKey,
        List<GeneratorVariantResponse> variants
) {}

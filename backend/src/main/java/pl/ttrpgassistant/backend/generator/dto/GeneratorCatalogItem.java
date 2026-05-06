package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorCatalogItem(
        String type,
        String system,
        String label,
        String description,
        List<GeneratorParamDefinition> params,
        String source
) {}

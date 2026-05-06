package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;

public record GeneratorVariantResponse(
        String generatorCode,
        String variantCode,
        String systemCode,
        String settingCode,
        String categoryCode,
        List<String> toneScope,
        String mode,
        String name,
        String description
) {}

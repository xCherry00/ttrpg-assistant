package pl.ttrpgassistant.backend.generator.dto;

public record GeneratorVariantResponse(
        String generatorCode,
        String variantCode,
        String systemCode,
        String settingCode,
        String mode,
        String name,
        String description
) {}

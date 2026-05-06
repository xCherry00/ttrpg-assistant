package pl.ttrpgassistant.backend.generator.dto;

import java.util.Map;

public record GeneratorRequest(
        Long campaignId,
        Map<String, Object> params
) {}

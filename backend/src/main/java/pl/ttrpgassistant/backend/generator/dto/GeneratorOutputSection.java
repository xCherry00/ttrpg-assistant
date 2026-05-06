package pl.ttrpgassistant.backend.generator.dto;

import java.util.List;
import java.util.Map;

public record GeneratorOutputSection(
        String type,
        String title,
        String content,
        List<Map<String, Object>> items
) {}

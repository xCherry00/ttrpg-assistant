package pl.ttrpgassistant.backend.generator;

import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

public interface GeneratorStrategy {
    boolean supports(String generatorCode, String variantCode);

    GeneratorStructuredResultResponse generate(GeneratorRequest request);
}

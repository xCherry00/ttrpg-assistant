package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorPoolResponse;

import java.util.Locale;
import java.util.Map;

@Service
public class GeneratorService {

    private final GeneratorPoolRepository repository;
    private final ObjectMapper objectMapper;

    public GeneratorService(GeneratorPoolRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public GeneratorPoolResponse getPool(String type, String system) {
        String normalizedType = normalize(type);
        String normalizedSystem = normalize(system);

        GeneratorPoolEntity entity = repository
                .findByGeneratorTypeAndSystemCode(normalizedType, normalizedSystem)
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));

        try {
            Map<String, Object> data = objectMapper.readValue(
                    entity.getPayloadJson(),
                    new TypeReference<>() {}
            );
            return new GeneratorPoolResponse(normalizedType, normalizedSystem, data);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}

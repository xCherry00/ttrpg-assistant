package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class LocationGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public LocationGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "location".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String requestedType = stringParam(params, "locationType", "Losowy");
        String type = randomChoice(requestedType) ? pick(asList(pool.get("types"))) : requestedType;
        String tone = stringParam(params, "tone", "Losowy");
        String name = pick(asList(pool.get("namePrefixes"))) + " " + pick(asList(pool.get("nameNouns")));

        List<GeneratorOutputSection> sections = List.of(
                section("Opis zewnetrzny", type + ": " + pick(asList(pool.get("exteriors"))) + "."),
                section("Opis wnetrza", pick(asList(pool.get("interiors"))) + "."),
                section("Atmosfera", (randomChoice(tone) ? pick(asList(pool.get("atmospheres"))) : tone) + "."),
                section("NPC obecny", pick(asList(pool.get("npcs"))) + "."),
                section("Sekret", pick(asList(pool.get("secrets"))) + "."),
                section("Haczyk", pick(asList(pool.get("hooks"))) + "."),
                section("Mozliwe zagrozenie", pick(asList(pool.get("hazards"))) + "."),
                section("Jak uzyc na sesji", "Najpierw pokaz jeden silny detal miejsca, potem NPC, ktory reaguje na obecnosc druzyny. Sekret zostaw jako nagrode za pytania albo eksploracje.")
        );

        return new GeneratorStructuredResultResponse(
                null,
                "location",
                "general.quick",
                name,
                type + " - lokacja fantasy",
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("location", "any", "general.quick")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return GeneratorTextSanitizer.clean(picked);
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }
}

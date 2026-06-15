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
public class TrapGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public TrapGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "trap".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String requestedType = stringParam(params, "trapType", "Losowa");
        String danger = stringParam(params, "danger", "Średnie");
        String type = randomChoice(requestedType) ? pick(asList(pool.get("types"))) : requestedType;
        String name = pick(asList(pool.get("names")));

        List<GeneratorOutputSection> sections = List.of(
                section("Typ", type),
                section("Poziom zagrożenia", danger),
                section("Wyzwalacz", pick(asList(pool.get("triggers"))) + "."),
                section("Wykrycie", pick(asList(pool.get("detections"))) + "."),
                section("Efekt", pick(asList(pool.get("effects"))) + "."),
                section("Rozbrojenie", pick(asList(pool.get("disarms"))) + "."),
                section("Konsekwencja", pick(asList(pool.get("consequences"))) + "."),
                section("Fair play dla MG", "Pokaz co najmniej jeden znak ostrzegawczy przed aktywacją. Pulapka ma tworzyc decyzje, nie tylko odejmowac HP.")
        );

        return new GeneratorStructuredResultResponse(
                null,
                "trap",
                "general.quick",
                name,
                type + " - zagrożenie: " + danger,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("trap", "any", "general.quick")
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

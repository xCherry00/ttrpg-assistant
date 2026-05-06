package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class WeatherGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public WeatherGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "weather".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String climate = stringParam(params, "climate", "Losowy");
        Map<String, Object> entry = pickEntry(pool, climate);

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Warunki", null, List.of(
                        item("Klimat", value(entry, "climate")),
                        item("Pora", value(entry, "season")),
                        item("Nastroj", value(entry, "mood"))
                )),
                section("Opis", value(entry, "description")),
                section("Efekt przy stole", value(entry, "effect")),
                section("Komplikacja podrozy", pick(List.of(
                        "Druzyna traci czas, jesli nie zmieni tempa marszu.",
                        "Slady przeciwnikow staja sie trudniejsze do odczytania.",
                        "Jedna lokalna grupa wykorzystuje pogode jako oslone do dzialania."
                ))),
                section("Szybka interpretacja", "Uzyj efektu jako miekkiej presji: koszt czasu, utrudnienie podrozy albo mocniejszy klimat sceny.")
        );

        return new GeneratorStructuredResultResponse(
                null,
                "weather",
                "general.quick",
                "Pogoda: " + value(entry, "climate"),
                "Srodowisko - " + value(entry, "season"),
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> pickEntry(Map<String, Object> pool, String climate) {
        List<Object> entries = asList(pool.get("entries"));
        if (!randomChoice(climate)) {
            String wanted = looseKey(climate);
            return entries.stream()
                    .map(this::asMap)
                    .filter(entry -> looseKey(String.valueOf(entry.get("climate"))).equals(wanted))
                    .findAny()
                    .orElseGet(() -> asMap(pickObject(entries)));
        }
        return asMap(pickObject(entries));
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("weather", "any", "default")
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

    private Map<String, Object> item(String label, Object value) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("label", label);
        item.put("value", value);
        return item;
    }

    private String value(Map<String, Object> entry, String key) {
        Object value = entry.get(key);
        return GeneratorTextSanitizer.clean(value);
    }

    private boolean randomChoice(String value) {
        String normalized = looseKey(value);
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

    private Object pickObject(List<?> list) {
        if (list == null || list.isEmpty()) return Map.of();
        return list.get(random.nextInt(list.size()));
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String looseKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}

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
public class HookGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public HookGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "hook".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String mood = stringParam(params, "mood", "Losowy");
        Map<String, Object> entry = pickEntry(pool, mood);

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
                        item("Klimat", value(entry, "mood")),
                        item("Skala", value(entry, "scale")),
                        item("Zrodlo", "seed")
                )),
                section("Sytuacja", value(entry, "situation")),
                section("Dziwny szczegol", value(entry, "detail")),
                section("Tropy", value(entry, "lead")),
                section("Komplikacja", pick(List.of(
                        "Ktos z lokalnych wie wiecej, ale boi sie powiedziec to publicznie.",
                        "Pierwszy trop prowadzi do osoby, ktora sama jest ofiara wiekszego planu.",
                        "Czas dziala przeciwko druzynie: po kazdej scenie problem przesuwa sie o krok dalej."
                ))),
                section("Jak odpalic scene", "Przedstaw problem przez NPC lub widoczny slad, a potem pokaz konsekwencje zwloki.")
        );

        return new GeneratorStructuredResultResponse(
                null,
                "hook",
                "general.quick",
                "Haczyk: " + value(entry, "mood"),
                "Fabula - " + value(entry, "scale"),
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> pickEntry(Map<String, Object> pool, String mood) {
        List<Object> entries = asList(pool.get("entries"));
        if (!randomChoice(mood)) {
            String wanted = looseKey(mood);
            return entries.stream()
                    .map(this::asMap)
                    .filter(entry -> looseKey(String.valueOf(entry.get("mood"))).equals(wanted))
                    .findAny()
                    .orElseGet(() -> asMap(pickObject(entries)));
        }
        return asMap(pickObject(entries));
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("hook", "any", "default")
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

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
public class NameGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public NameGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "name".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        Map<String, Object> cultures = asMap(pool.get("cultures"));
        String requestedCulture = stringParam(params, "culture", "Losowa");
        String culture = randomChoice(requestedCulture) ? pick(new ArrayList<>(cultures.keySet())) : matchingKey(cultures, requestedCulture);
        Map<String, Object> selected = asMap(cultures.getOrDefault(culture, cultures.values().stream().findFirst().orElse(Map.of())));
        String requestedGender = stringParam(params, "gender", "Losowa");
        String gender = genderKey(requestedGender);
        String format = stringParam(params, "nameFormat", "Imię + nazwisko");
        int count = intParam(params, "count", 3, 1, 10);

        List<Map<String, Object>> names = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String currentGender = "random".equals(gender) ? pick(List.of("male", "female", "neutral")) : gender;
            List<Object> givenNames = asList(selected.get(currentGender));
            if (givenNames.isEmpty()) {
                givenNames = asList(selected.get("neutral"));
            }
            String given = pick(givenNames);
            String family = pick(asList(selected.get("family")));
            names.add(item(formatName(given, family, format), displayGender(currentGender)));
        }

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Ustawienia", null, List.of(
                        item("Kultura", culture),
                        item("Płeć", randomChoice(requestedGender) ? "Losowa" : requestedGender),
                        item("Format", format),
                        item("Liczba wyników", count)
                )),
                new GeneratorOutputSection("table", "Imiona i aliasy", null, names)
        );

        return new GeneratorStructuredResultResponse(
                null,
                "name",
                "general.quick",
                "Imiona: " + culture,
                "Imiona - " + culture,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("name", "any", "default")
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

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : looseKey(value);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String matchingKey(Map<String, Object> map, String requested) {
        String wanted = looseKey(requested);
        List<String> candidates = cultureCandidates(wanted);
        return map.keySet().stream()
                .filter(key -> candidates.contains(looseKey(key)))
                .findFirst()
                .orElseGet(() -> map.keySet().stream().findFirst().orElse(requested));
    }

    private List<String> cultureCandidates(String wanted) {
        if (wanted.contains("lacinska") || wanted.contains("rzymska") || wanted.contains("lacinski") || wanted.contains("rzymski")) {
            return List.of("lacinska / rzymska", "lacinska", "rzymska", "romanska", "roman");
        }
        if (wanted.contains("azjatycka")) {
            return List.of("azjatycka ogolna", "japonska", "chinska", "koreanska");
        }
        if (wanted.contains("afrykanska")) {
            return List.of("afrykanska ogolna", "egipska");
        }
        return List.of(wanted);
    }

    private String genderKey(String value) {
        return switch (looseKey(value)) {
            case "meska", "male" -> "male";
            case "zenska", "female" -> "female";
            case "neutralna", "neutral" -> "neutral";
            default -> "random";
        };
    }

    private String displayGender(String gender) {
        return switch (gender) {
            case "male" -> "Męska";
            case "female" -> "Żeńska";
            case "neutral" -> "Neutralna";
            default -> "Losowa";
        };
    }

    private String formatName(String given, String family, String format) {
        return switch (looseKey(format)) {
            case "tylko imie" -> given;
            case "tylko nazwisko" -> family;
            default -> given + " " + family;
        };
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private int intParam(Map<String, Object> params, String key, int fallback, int min, int max) {
        Object value = params.get(key);
        int parsed = fallback;
        if (value instanceof Number number) {
            parsed = number.intValue();
        } else if (value != null && !String.valueOf(value).isBlank()) {
            try {
                parsed = Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                parsed = fallback;
            }
        }
        return Math.max(min, Math.min(max, parsed));
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String looseKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value.replace('Ł', 'L').replace('ł', 'l'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}

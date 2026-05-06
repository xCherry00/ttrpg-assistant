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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class NpcGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public NpcGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "npc".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String requestedRole = stringParam(params, "role", "Losowa");
        String role = randomChoice(requestedRole)
                ? pick(asList(pool.get("roles")))
                : requestedRole;
        boolean includeSecret = booleanParam(params, "includeSecret", true);

        String fullName = pick(asList(pool.get("givenNames"))) + " " + pick(asList(pool.get("familyNames")));
        int age = 18 + random.nextInt(53);
        String appearance = pick(asList(pool.get("appearances")));
        String personality = pick(asList(pool.get("personalities")));
        String motivation = pick(asList(pool.get("motivations")));
        String hook = pick(asList(pool.get("hooks")));
        String secret = includeSecret ? pick(asList(pool.get("secrets"))) : null;

        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(new GeneratorOutputSection(
                "text",
                "Opis",
                "%s, %d lat. %s.".formatted(role, age, appearance),
                List.of()
        ));
        sections.add(new GeneratorOutputSection(
                "text",
                "Osobowość i motywacja",
                personality + ". " + motivation + ".",
                List.of()
        ));
        if (secret != null && !secret.isBlank()) {
            sections.add(new GeneratorOutputSection("text", "Sekret", secret + ".", List.of()));
        }
        sections.add(new GeneratorOutputSection("text", "Haczyk", hook + ".", List.of()));
        sections.add(new GeneratorOutputSection(
                "stats",
                "Szybkie dane",
                null,
                List.of(
                        item("Rola", role),
                        item("Wiek", age),
                        item("Źródło", "seed")
                )
        ));

        return new GeneratorStructuredResultResponse(
                null,
                "npc",
                "general.quick",
                fullName,
                role + " | NPC ogólny szybki",
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("npc", "any", "general.quick")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private Map<String, Object> item(String label, Object value) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("label", label);
        item.put("value", value);
        return item;
    }

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean booleanParam(Map<String, Object> params, String key, boolean fallback) {
        Object value = params.get(key);
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value != null && !String.valueOf(value).isBlank()) {
            return Boolean.parseBoolean(String.valueOf(value));
        }
        return fallback;
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return picked == null ? "" : String.valueOf(picked);
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }
}

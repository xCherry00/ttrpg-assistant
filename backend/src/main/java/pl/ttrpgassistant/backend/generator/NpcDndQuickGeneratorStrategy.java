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
public class NpcDndQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public NpcDndQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "npc".equals(generatorCode) && "dnd.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        int level = intParam(params, "level", 5, 1, 20);
        String race = choiceParam(params, "race", asList(pool.get("races")), "Człowiek");
        String profession = choiceParam(params, "profession", asList(pool.get("professions")), "Kupiec");
        String role = choiceParam(params, "role", asList(pool.get("roles")), "Contact");
        String alignment = choiceParam(params, "alignment", asList(pool.get("alignments")), "True Neutral");
        String fullName = pick(asList(pool.get("names"))) + " " + pick(asList(pool.get("family")));
        Map<String, Object> appearance = asMap(pool.get("appearance"));
        String look = String.join(", ",
                pick(asList(appearance.get("build"))),
                pick(asList(appearance.get("face"))),
                pick(asList(appearance.get("clothes")))
        );

        int proficiency = Math.max(2, 2 + ((level - 1) / 4));
        int dex = 10 + random.nextInt(8);
        int con = 10 + random.nextInt(8);
        int mainStat = 12 + Math.min(6, proficiency + random.nextInt(3));
        int hp = Math.max(4, level * (5 + ((con - 10) / 2)) + 6);
        int ac = 11 + Math.min(6, (dex - 10) / 2 + proficiency / 2);
        String attack = pick(asList(pool.get("attacks")));

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Profil", null, List.of(
                        item("Rasa", race),
                        item("Rola", role),
                        item("Profesja", profession),
                        item("Charakter", alignment),
                        item("Poziom", level)
                )),
                section("Wygląd", look + "."),
                section("Osobowość", pick(asList(pool.get("personalities"))) + "."),
                section("Ideał", pick(asList(pool.get("ideals"))) + "."),
                section("Motywacja", pick(asList(pool.get("motivations"))) + "."),
                section("Sekret", pick(asList(pool.get("secrets"))) + "."),
                section("Haczyk dla drużyny", pick(asList(pool.get("hooks"))) + "."),
                new GeneratorOutputSection("stats", "Szybki stat block", null, List.of(
                        item("HP", hp),
                        item("AC", ac),
                        item("Init", "+" + Math.max(0, (dex - 10) / 2)),
                        item("Prof", "+" + proficiency),
                        item("Atrybuty", "STR %d, DEX %d, CON %d, INT %d, WIS %d, CHA %d".formatted(mainStat, dex, con, 8 + random.nextInt(8), 8 + random.nextInt(8), 8 + random.nextInt(8))),
                        item("Atak", "%s +%d do trafienia, 1d6+%d obrażeń".formatted(attack, proficiency + 2, Math.max(1, proficiency)))
                ))
        );

        return new GeneratorStructuredResultResponse(
                null,
                "npc",
                "dnd.quick",
                fullName,
                "NPC • D&D 5E • poziom " + level,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("npc", "dnd", "default")
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

    private String choiceParam(Map<String, Object> params, String key, List<Object> options, String fallback) {
        String value = stringParam(params, key, "Losowa");
        if (randomChoice(value)) {
            return pick(options.isEmpty() ? List.of(fallback) : options);
        }
        return value;
    }

    private boolean randomChoice(String value) {
        String normalized = looseKey(value);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
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
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}

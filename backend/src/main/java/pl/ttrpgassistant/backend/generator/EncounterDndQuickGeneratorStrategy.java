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
public class EncounterDndQuickGeneratorStrategy implements GeneratorStrategy {
    private static final Map<Integer, int[]> XP_THRESHOLDS = Map.ofEntries(
            Map.entry(1, new int[]{25, 50, 75, 100}),
            Map.entry(2, new int[]{50, 100, 150, 200}),
            Map.entry(3, new int[]{75, 150, 225, 400}),
            Map.entry(4, new int[]{125, 250, 375, 500}),
            Map.entry(5, new int[]{250, 500, 750, 1100}),
            Map.entry(6, new int[]{300, 600, 900, 1400}),
            Map.entry(7, new int[]{350, 750, 1100, 1700}),
            Map.entry(8, new int[]{450, 900, 1400, 2100}),
            Map.entry(9, new int[]{550, 1100, 1600, 2400}),
            Map.entry(10, new int[]{600, 1200, 1900, 2800}),
            Map.entry(11, new int[]{800, 1600, 2400, 3600}),
            Map.entry(12, new int[]{1000, 2000, 3000, 4500}),
            Map.entry(13, new int[]{1100, 2200, 3400, 5100}),
            Map.entry(14, new int[]{1250, 2500, 3800, 5700}),
            Map.entry(15, new int[]{1400, 2800, 4300, 6400}),
            Map.entry(16, new int[]{1600, 3200, 4800, 7200}),
            Map.entry(17, new int[]{2000, 3900, 5900, 8800}),
            Map.entry(18, new int[]{2100, 4200, 6300, 9500}),
            Map.entry(19, new int[]{2400, 4900, 7300, 10900}),
            Map.entry(20, new int[]{2800, 5700, 8500, 12700})
    );

    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public EncounterDndQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "encounter".equals(generatorCode) && "dnd.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String mode = stringParam(params, "encounterMode", "Combat");
        if ("non-combat".equalsIgnoreCase(mode)) {
            return nonCombat(params, pool);
        }
        return combat(params, pool);
    }

    private GeneratorStructuredResultResponse combat(Map<String, Object> params, Map<String, Object> pool) {
        int partyLevel = intParam(params, "partyLevel", 5, 1, 20);
        int partySize = intParam(params, "partySize", 4, 1, 8);
        String difficulty = stringParam(params, "difficulty", "Medium");
        String environment = stringParam(params, "environment", "Las");
        String encounterType = stringParam(params, "encounterType", "Zasadzka");
        boolean includeTwist = boolParam(params, "includeTwist", true);
        boolean includeEnvironmentFeature = boolParam(params, "includeEnvironmentFeature", true);

        int baseBudget = XP_THRESHOLDS.getOrDefault(partyLevel, XP_THRESHOLDS.get(5))[difficultyIndex(difficulty)] * partySize;
        List<Map<String, Object>> enemies = pickEnemies(pool, environment, baseBudget);
        int baseXp = enemies.stream().mapToInt(enemy -> numeric(enemy.get("totalXp"), 0)).sum();
        int enemyCount = enemies.stream().mapToInt(enemy -> numeric(enemy.get("count"), 1)).sum();
        double multiplier = multiplier(enemyCount);
        int adjustedXp = (int) Math.round(baseXp * multiplier);
        String rating = rating(adjustedXp, baseBudget);
        String envFeature = includeEnvironmentFeature ? environmentFeature(pool, environment) : "Brak dodatkowego elementu środowiska.";
        String twist = includeTwist ? pick(asList(pool.get("twists"))) : "Brak twistu.";
        String objective = pick(asList(pool.get("objectives")));

        List<Map<String, Object>> summary = List.of(
                item("Tryb", "Combat"),
                item("Trudność", difficulty),
                item("Poziom drużyny", partyLevel),
                item("Liczba postaci", partySize),
                item("Budżet XP", baseBudget),
                item("XP bazowe", baseXp),
                item("XP skorygowane", adjustedXp),
                item("Dopasowanie", rating)
        );

        List<Map<String, Object>> enemyItems = enemies.stream()
                .map(enemy -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("label", enemy.get("name") + " x" + enemy.get("count"));
                    item.put("value", enemy.get("totalXp") + " XP");
                    item.put("cr", enemy.get("cr"));
                    item.put("role", enemy.get("role"));
                    return item;
                })
                .toList();

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Podsumowanie", null, summary),
                new GeneratorOutputSection("table", "Przeciwnicy", null, enemyItems),
                section("Element środowiska", envFeature),
                section("Cel encountera", objective),
                section("Twist", twist)
        );

        return new GeneratorStructuredResultResponse(
                null,
                "encounter",
                "dnd.quick",
                title(encounterType, environment),
                "Encounter • 5E compatible • " + difficulty,
                sections,
                "algorithm/seed",
                OffsetDateTime.now()
        );
    }

    private GeneratorStructuredResultResponse nonCombat(Map<String, Object> params, Map<String, Object> pool) {
        String difficulty = stringParam(params, "difficulty", "Medium");
        String environment = stringParam(params, "environment", "Miasto");
        String encounterType = stringParam(params, "encounterType", "Negocjacje");
        boolean includeTwist = boolParam(params, "includeTwist", true);
        boolean includeEnvironmentFeature = boolParam(params, "includeEnvironmentFeature", true);

        String conflict = pick(asList(pool.get("nonCombatConflicts")));
        String sólution = pick(asList(pool.get("sólutions")));
        String consequence = pick(asList(pool.get("failureConsequences")));
        String skillChallenge = pick(asList(pool.get("skillChallenges")));
        String envFeature = includeEnvironmentFeature ? environmentFeature(pool, environment) : "Brak dodatkowego elementu środowiska.";
        String twist = includeTwist ? pick(asList(pool.get("twists"))) : "Brak twistu.";

        List<GeneratorOutputSection> sections = List.of(
                new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
                        item("Tryb", "Non-combat"),
                        item("Trudność", difficulty),
                        item("Typ sceny", encounterType),
                        item("Środowisko", environment)
                )),
                section("Konflikt", conflict),
                section("Możliwe rozwiązania", sólution),
                section("Konsekwencja porażki", consequence),
                section("Test / skill challenge", skillChallenge),
                section("Element środowiska", envFeature),
                section("Twist", twist)
        );

        return new GeneratorStructuredResultResponse(
                null,
                "encounter",
                "dnd.quick",
                title(encounterType, environment),
                "Encounter • 5E compatible • Non-combat",
                sections,
                "algorithm/seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("encounter", "dnd", "dnd.quick")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private List<Map<String, Object>> pickEnemies(Map<String, Object> pool, String environment, int budget) {
        List<Map<String, Object>> candidates = asList(pool.get("enemies")).stream()
                .map(this::asMap)
                .filter(enemy -> asList(enemy.get("environments")).stream().map(String::valueOf).anyMatch(environment::equalsIgnoreCase))
                .filter(enemy -> numeric(enemy.get("xp"), 0) <= Math.max(50, budget))
                .toList();
        if (candidates.isEmpty()) {
            candidates = asList(pool.get("enemies")).stream().map(this::asMap).toList();
        }

        List<Map<String, Object>> selected = new ArrayList<>();
        int baseXp = 0;
        int guard = 0;
        int targetBaseXp = Math.max(50, Math.round(budget * 0.55f));
        while (baseXp < targetBaseXp && selected.size() < 4 && guard < 20) {
            guard++;
            Map<String, Object> enemy = candidates.get(random.nextInt(candidates.size()));
            int xp = Math.max(25, numeric(enemy.get("xp"), 50));
            int maxCount = Math.max(1, Math.min(6, Math.round((budget - baseXp) / (float) xp)));
            int count = Math.max(1, random.nextInt(maxCount) + 1);
            int totalXp = xp * count;
            if (baseXp + totalXp > targetBaseXp * 1.3 && !selected.isEmpty()) {
                continue;
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", enemy.get("name"));
            row.put("cr", enemy.get("cr"));
            row.put("role", enemy.get("role"));
            row.put("count", count);
            row.put("totalXp", totalXp);
            selected.add(row);
            baseXp += totalXp;
        }
        if (selected.isEmpty() && !candidates.isEmpty()) {
            Map<String, Object> enemy = candidates.get(random.nextInt(candidates.size()));
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", enemy.get("name"));
            row.put("cr", enemy.get("cr"));
            row.put("role", enemy.get("role"));
            row.put("count", 1);
            row.put("totalXp", numeric(enemy.get("xp"), 50));
            selected.add(row);
        }
        return selected;
    }

    private String environmentFeature(Map<String, Object> pool, String environment) {
        Map<String, Object> features = asMap(pool.get("environmentFeatures"));
        List<Object> options = asList(features.get(environment));
        if (options.isEmpty()) {
            options = features.values().stream().findFirst().map(this::asList).orElse(List.of());
        }
        String picked = pick(options);
        return picked.isBlank() ? "Teren nie daje wyraźnej przewagi żadnej stronie." : picked + ".";
    }

    private int difficultyIndex(String difficulty) {
        return switch (difficulty.toLowerCase(Locale.ROOT)) {
            case "easy" -> 0;
            case "hard" -> 2;
            case "deadly" -> 3;
            default -> 1;
        };
    }

    private double multiplier(int enemyCount) {
        if (enemyCount <= 1) return 1.0;
        if (enemyCount == 2) return 1.5;
        if (enemyCount <= 6) return 2.0;
        if (enemyCount <= 10) return 2.5;
        if (enemyCount <= 14) return 3.0;
        return 4.0;
    }

    private String rating(int adjustedXp, int budget) {
        double ratio = budget <= 0 ? 1 : adjustedXp / (double) budget;
        if (ratio < 0.75) return "poniżej budżetu";
        if (ratio <= 1.25) return "dobrze dopasowane";
        if (ratio <= 1.6) return "ryzykownie wysokie";
        return "bardzo niebezpieczne";
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

    private String title(String encounterType, String environment) {
        return encounterType + " " + environmentLocative(environment);
    }

    private String environmentLocative(String environment) {
        return switch (environment.toLowerCase(Locale.ROOT)) {
            case "las" -> "w lesie";
            case "miasto" -> "w mieście";
            case "ruiny" -> "w ruinach";
            case "góry", "gory" -> "w górach";
            case "bagna" -> "na bagnach";
            case "podziemią" -> "w podziemiąch";
            case "lochy" -> "w lochach";
            default -> "w " + environment.toLowerCase(Locale.ROOT);
        };
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

    private boolean boolParam(Map<String, Object> params, String key, boolean fallback) {
        Object value = params.get(key);
        if (value == null) return fallback;
        if (value instanceof Boolean bool) return bool;
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private int numeric(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }
}

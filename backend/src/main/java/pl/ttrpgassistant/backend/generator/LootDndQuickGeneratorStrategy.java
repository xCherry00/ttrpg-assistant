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
public class LootDndQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public LootDndQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "loot".equals(generatorCode) && "dnd.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String treasureType = stringParam(params, "treasureType", "Treasure Hoard");
        String crBand = stringParam(params, "crBand", "0-4");
        String contents = stringParam(params, "contents", "Wszystko");
        String theme = stringParam(params, "theme", "Podziemie");
        int tier = crTier(crBand);
        boolean hoard = treasureType.toLowerCase(Locale.ROOT).contains("hoard") || treasureType.toLowerCase(Locale.ROOT).contains("skarbiec");

        boolean includeCoins = includes(contents, "Monety") || includes(contents, "Wszystko");
        boolean includeValuables = includes(contents, "Kosztowności") || includes(contents, "Wszystko");
        boolean includeMagic = includes(contents, "Magiczne") || includes(contents, "Wszystko");

        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
                item("Typ", hoard ? "Skarbiec" : "Łup indywidualny"),
                item("CR / poziom", crBand),
                item("Motyw", theme),
                item("Źródło", "D&D 5E seed")
        )));
        if (includeCoins) {
            sections.add(section("Monety", coinsForTier(tier, hoard)));
        }
        if (includeValuables) {
            sections.add(new GeneratorOutputSection("table", "Klejnoty i kosztowności", null, valuablesForTier(pool, tier, hoard)));
        }
        if (includeMagic) {
            sections.add(section("Magiczne przedmioty", magicItemsForTier(pool, tier, hoard)));
        }
        sections.add(section("Drobiazgi", mundaneItems(pool, hoard ? 3 : 1)));
        sections.add(section("Gdzie leży", pick(asList(pool.get("containers"))) + ", " + pick(asList(pool.get("hidingPlaces"))) + "."));
        sections.add(section("Szczegół MG", pick(asList(pool.get("quirks"))) + "."));

        return new GeneratorStructuredResultResponse(
                null,
                "loot",
                "dnd.quick",
                hoard ? "Skarbiec D&D 5E" : "Łup indywidualny D&D 5E",
                "Skarb / Przedmiot • D&D 5E • " + crBand,
                sections,
                "algorithm/seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("loot", "dnd", "default")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private List<Map<String, Object>> valuablesForTier(Map<String, Object> pool, int tier, boolean hoard) {
        List<Object> gems = asList(pool.get("gems"));
        List<Object> artObjects = asList(pool.get("artObjects"));
        int count = hoard ? 2 + tier + random.nextInt(3) : 1 + random.nextInt(2);
        List<Map<String, Object>> valuables = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> picked = asMap(random.nextBoolean() ? pickObject(gems) : pickObject(artObjects));
            if (!picked.isEmpty()) {
                valuables.add(item(String.valueOf(picked.get("name")), picked.get("value") + " gp"));
            }
        }
        return valuables;
    }

    private String magicItemsForTier(Map<String, Object> pool, int tier, boolean hoard) {
        Map<String, Object> magic = asMap(pool.get("magicItems"));
        String rarity = switch (tier) {
            case 0 -> "common";
            case 1 -> random.nextBoolean() ? "common" : "uncommon";
            case 2 -> random.nextBoolean() ? "uncommon" : "rare";
            default -> hoard && random.nextInt(4) == 0 ? "legendary" : "veryRare";
        };
        int count = hoard ? 1 + random.nextInt(Math.max(1, tier + 1)) : 1;
        List<String> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(pick(asList(magic.get(rarity))));
        }
        return String.join(", ", items);
    }

    private String mundaneItems(Map<String, Object> pool, int count) {
        List<String> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            items.add(pick(asList(pool.get("mundaneItems"))));
        }
        return String.join(", ", items);
    }

    private String coinsForTier(int tier, boolean hoard) {
        int scale = hoard ? 8 : 1;
        int cp = tier <= 1 ? roll(4, 6) * 10 * scale : 0;
        int sp = roll(3 + tier, 6) * 10 * scale;
        int gp = roll(2 + tier, 6) * (tier == 0 ? 5 : 25) * scale;
        int pp = tier >= 2 ? roll(1 + tier, 6) * 5 * scale : 0;
        List<String> coins = new ArrayList<>();
        if (cp > 0) coins.add(cp + " cp");
        if (sp > 0) coins.add(sp + " sp");
        if (gp > 0) coins.add(gp + " gp");
        if (pp > 0) coins.add(pp + " pp");
        return String.join(", ", coins);
    }

    private int roll(int count, int sides) {
        int total = 0;
        for (int i = 0; i < count; i++) {
            total += 1 + random.nextInt(sides);
        }
        return total;
    }

    private int crTier(String crBand) {
        if (crBand == null) return 0;
        if (crBand.contains("17")) return 3;
        if (crBand.contains("11")) return 2;
        if (crBand.contains("5")) return 1;
        return 0;
    }

    private boolean includes(String value, String option) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(option.toLowerCase(Locale.ROOT));
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
}

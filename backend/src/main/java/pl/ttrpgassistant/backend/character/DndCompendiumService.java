package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DndCompendiumService {

    private final Dnd5eApiClient apiClient;

    public DndCompendiumService(Dnd5eApiClient apiClient) {
        this.apiClient = apiClient;
    }

    public List<Map<String, Object>> classes() {
        return loadList("/classes", fallbackClasses());
    }

    public List<Map<String, Object>> races() {
        return loadList("/races", fallbackRaces());
    }

    public List<Map<String, Object>> backgrounds() {
        return List.of(
                item("soldier", "Soldier"),
                item("criminal", "Criminal"),
                item("sage", "Sage"),
                item("acolyte", "Acolyte"),
                item("noble", "Noble"),
                item("folk-hero", "Folk Hero")
        );
    }

    public Map<String, Object> classDetail(String classIndex) {
        return safeGet("/classes/" + classIndex, Map.of("index", classIndex, "name", classIndex, "hit_die", 8));
    }

    public Map<String, Object> raceDetail(String raceIndex) {
        return safeGet("/races/" + raceIndex, Map.of("index", raceIndex, "name", raceIndex, "speed", 30, "ability_bonuses", List.of()));
    }

    public Map<String, Object> backgroundDetail(String backgroundIndex) {
        return switch (backgroundIndex) {
            case "soldier" -> Map.of("index", "soldier", "name", "Soldier", "feature", "Military Rank", "skills", List.of("athletics", "intimidation"));
            case "criminal" -> Map.of("index", "criminal", "name", "Criminal", "feature", "Criminal Contact", "skills", List.of("deception", "stealth"));
            case "sage" -> Map.of("index", "sage", "name", "Sage", "feature", "Researcher", "skills", List.of("arcana", "history"));
            case "acolyte" -> Map.of("index", "acolyte", "name", "Acolyte", "feature", "Shelter of the Faithful", "skills", List.of("insight", "religion"));
            case "noble" -> Map.of("index", "noble", "name", "Noble", "feature", "Position of Privilege", "skills", List.of("history", "persuasion"));
            default -> Map.of("index", "folk-hero", "name", "Folk Hero", "feature", "Rustic Hospitality", "skills", List.of("animal-handling", "survival"));
        };
    }

    public List<String> classSavingThrows(String classIndex) {
        Map<String, Object> detail = classDetail(classIndex);
        List<Map<String, Object>> throwsList = asMapList(detail.get("saving_throws"));
        if (throwsList.isEmpty()) {
            return switch (classIndex) {
                case "fighter", "barbarian", "paladin" -> List.of("strength", "constitution");
                case "wizard", "artificer" -> List.of("intelligence", "wisdom");
                case "cleric", "warlock" -> List.of("wisdom", "charisma");
                case "rogue" -> List.of("dexterity", "intelligence");
                default -> List.of("dexterity", "wisdom");
            };
        }
        List<String> result = new ArrayList<>();
        for (Map<String, Object> item : throwsList) {
            result.add(String.valueOf(item.getOrDefault("index", "")));
        }
        return result;
    }

    public List<String> classLevelOneFeatures(String classIndex) {
        try {
            Map<String, Object> level = apiClient.get("/classes/" + classIndex + "/levels/1");
            List<Map<String, Object>> results = asMapList(level.get("features"));
            if (results.isEmpty()) {
                List<Map<String, Object>> rootList = asMapList(level.get("results"));
                if (!rootList.isEmpty()) {
                    results = asMapList(rootList.get(0).get("features"));
                }
            }
            List<String> names = new ArrayList<>();
            for (Map<String, Object> item : results) {
                names.add(String.valueOf(item.getOrDefault("name", item.getOrDefault("index", "feature"))));
            }
            return names;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    public List<String> classStartingEquipment(String classIndex) {
        Map<String, Object> detail = classDetail(classIndex);
        List<Map<String, Object>> equipment = asMapList(detail.get("starting_equipment"));
        List<String> items = new ArrayList<>();
        for (Map<String, Object> row : equipment) {
            Object quantity = row.getOrDefault("quantity", 1);
            Map<String, Object> eq = asMap(row.get("equipment"));
            String name = String.valueOf(eq.getOrDefault("name", "item"));
            items.add(quantity + "x " + name);
        }
        return items;
    }

    public List<String> raceTraits(String raceIndex) {
        Map<String, Object> detail = raceDetail(raceIndex);
        List<Map<String, Object>> traits = asMapList(detail.get("traits"));
        List<String> names = new ArrayList<>();
        for (Map<String, Object> item : traits) {
            names.add(String.valueOf(item.getOrDefault("name", item.getOrDefault("index", "trait"))));
        }
        return names;
    }

    public List<String> classSpells(String classIndex) {
        try {
            Map<String, Object> spells = apiClient.get("/classes/" + classIndex + "/spells");
            List<Map<String, Object>> results = asMapList(spells.get("results"));
            List<String> names = new ArrayList<>();
            for (int i = 0; i < Math.min(6, results.size()); i++) {
                names.add(String.valueOf(results.get(i).getOrDefault("name", "spell")));
            }
            return names;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private List<Map<String, Object>> loadList(String path, List<Map<String, Object>> fallback) {
        try {
            Map<String, Object> data = apiClient.get(path);
            List<Map<String, Object>> results = asMapList(data.get("results"));
            if (results.isEmpty()) {
                return fallback;
            }
            List<Map<String, Object>> normalized = new ArrayList<>();
            for (Map<String, Object> item : results) {
                normalized.add(item(String.valueOf(item.getOrDefault("index", "")), String.valueOf(item.getOrDefault("name", ""))));
            }
            return normalized;
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Map<String, Object> safeGet(String path, Map<String, Object> fallback) {
        try {
            return apiClient.get(path);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private Map<String, Object> item(String index, String name) {
        Map<String, Object> out = new HashMap<>();
        out.put("index", index);
        out.put("name", name);
        return out;
    }

    private List<Map<String, Object>> fallbackClasses() {
        return List.of(item("fighter", "Fighter"), item("wizard", "Wizard"), item("cleric", "Cleric"), item("rogue", "Rogue"), item("paladin", "Paladin"), item("warlock", "Warlock"));
    }

    private List<Map<String, Object>> fallbackRaces() {
        return List.of(item("human", "Human"), item("elf", "Elf"), item("dwarf", "Dwarf"), item("halfling", "Halfling"), item("half-elf", "Half-Elf"), item("dragonborn", "Dragonborn"));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asMapList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> out = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    out.add((Map<String, Object>) map);
                }
            }
            return out;
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

package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DndCharacterSheetService {
    private static final List<Integer> STANDARD_ARRAY = List.of(15, 14, 13, 12, 10, 8);
    private static final List<String> CASTER_CLASSES = List.of("wizard", "cleric", "warlock");

    private final DndCompendiumService compendiumService;
    private final DndCharacterDefaultsService defaultsService;

    public DndCharacterSheetService(DndCompendiumService compendiumService, DndCharacterDefaultsService defaultsService) {
        this.compendiumService = compendiumService;
        this.defaultsService = defaultsService;
    }

    public Map<String, Object> generate(String name, String raceIndex, String classIndex, String backgroundIndex, String portraitUrl) {
        Map<String, Object> race = compendiumService.raceDetail(raceIndex);
        Map<String, Object> clazz = compendiumService.classDetail(classIndex);
        Map<String, Object> background = compendiumService.backgroundDetail(backgroundIndex);

        Map<String, Integer> abilities = assignAbilities(classIndex);
        applyRaceBonuses(abilities, race);

        int conMod = mod(abilities.get("constitution"));
        int dexMod = mod(abilities.get("dexterity"));
        int hitDie = intValue(clazz.get("hit_die"), 8);
        int maxHp = Math.max(1, hitDie + conMod);
        int speed = intValue(race.get("speed"), 30);

        List<String> equipment = new ArrayList<>(compendiumService.classStartingEquipment(classIndex));
        if (equipment.isEmpty()) {
            equipment.addAll(defaultsService.defaultEquipmentChoices(classIndex));
        }

        List<String> features = new ArrayList<>();
        features.addAll(compendiumService.raceTraits(raceIndex));
        features.addAll(compendiumService.classLevelOneFeatures(classIndex));
        String backgroundFeature = String.valueOf(background.getOrDefault("feature", defaultsService.backgroundFallbacks().getOrDefault(backgroundIndex, "Background Feature")));
        features.add(backgroundFeature);

        List<String> spells = null;
        if (CASTER_CLASSES.contains(classIndex)) {
            spells = new ArrayList<>(compendiumService.classSpells(classIndex));
            if (spells.isEmpty()) {
                spells.addAll(defaultsService.defaultSpellChoices(classIndex));
            }
        }

        Map<String, Object> sheet = new LinkedHashMap<>();
        sheet.put("system", "DND5E_2014");
        sheet.put("level", 1);
        sheet.put("sourceRefs", Map.of("race", raceIndex, "class", classIndex, "background", backgroundIndex));
        sheet.put("snapshots", Map.of("race", race, "class", clazz, "background", background));
        sheet.put("identity", Map.of(
                "name", name,
                "race", String.valueOf(race.getOrDefault("name", raceIndex)),
                "className", String.valueOf(clazz.getOrDefault("name", classIndex)),
                "background", String.valueOf(background.getOrDefault("name", backgroundIndex)),
                "portraitUrl", portraitUrl == null ? "" : portraitUrl
        ));
        sheet.put("abilityScores", abilities);
        sheet.put("combat", Map.of(
                "maxHp", maxHp,
                "currentHp", maxHp,
                "tempHp", 0,
                "armorClass", defaultsService.armorClassPreset(classIndex),
                "initiative", dexMod,
                "speed", speed,
                "proficiencyBonus", 2,
                "hitDice", "1d" + hitDie
        ));
        sheet.put("savingThrows", compendiumService.classSavingThrows(classIndex));
        sheet.put("skills", defaultsService.defaultSkillChoices(classIndex, backgroundIndex));
        sheet.put("inventory", equipment);
        sheet.put("featuresTraits", features);
        sheet.put("spells", spells);
        sheet.put("notes", new LinkedHashMap<>(Map.of(
                "backstory", "",
                "personality", "",
                "appearance", "",
                "privateNotes", ""
        )));
        return sheet;
    }

    private Map<String, Integer> assignAbilities(String classIndex) {
        List<String> priorities = defaultsService.classAbilityPriorities(classIndex);
        Map<String, Integer> stats = new LinkedHashMap<>();
        for (int i = 0; i < priorities.size(); i++) {
            stats.put(priorities.get(i), STANDARD_ARRAY.get(i));
        }
        return stats;
    }

    @SuppressWarnings("unchecked")
    private void applyRaceBonuses(Map<String, Integer> abilities, Map<String, Object> race) {
        Object raw = race.get("ability_bonuses");
        if (!(raw instanceof List<?> bonuses)) {
            return;
        }
        for (Object item : bonuses) {
            if (!(item instanceof Map<?, ?> map)) {
                continue;
            }
            Map<String, Object> abilityScore = map.get("ability_score") instanceof Map<?, ?> a ? (Map<String, Object>) a : Map.of();
            String ability = String.valueOf(abilityScore.getOrDefault("index", ""));
            int bonus = intValue(map.get("bonus"), 0);
            if (abilities.containsKey(ability)) {
                abilities.put(ability, abilities.get(ability) + bonus);
            }
        }
    }

    private int mod(int score) {
        return (int) Math.floor((score - 10) / 2.0);
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (Exception ignored) {
            return fallback;
        }
    }
}

package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DndCharacterDefaultsService {

    public List<String> classAbilityPriorities(String classIndex) {
        return switch (classIndex) {
            case "barbarian" -> List.of("strength", "constitution", "dexterity", "wisdom", "charisma", "intelligence");
            case "fighter" -> List.of("strength", "constitution", "dexterity", "wisdom", "charisma", "intelligence");
            case "rogue" -> List.of("dexterity", "constitution", "intelligence", "wisdom", "charisma", "strength");
            case "wizard" -> List.of("intelligence", "constitution", "dexterity", "wisdom", "charisma", "strength");
            case "cleric" -> List.of("wisdom", "constitution", "strength", "dexterity", "charisma", "intelligence");
            case "ranger" -> List.of("dexterity", "wisdom", "constitution", "strength", "charisma", "intelligence");
            case "paladin" -> List.of("strength", "charisma", "constitution", "wisdom", "dexterity", "intelligence");
            case "warlock" -> List.of("charisma", "constitution", "dexterity", "wisdom", "intelligence", "strength");
            default -> List.of("strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma");
        };
    }

    public List<String> defaultSkillChoices(String classIndex, String backgroundIndex) {
        List<String> classSkills = switch (classIndex) {
            case "fighter" -> List.of("athletics", "survival");
            case "rogue" -> List.of("stealth", "perception");
            case "wizard" -> List.of("arcana", "investigation");
            case "cleric" -> List.of("insight", "religion");
            case "warlock" -> List.of("deception", "arcana");
            default -> List.of("perception", "athletics");
        };
        List<String> backgroundSkills = switch (backgroundIndex) {
            case "soldier" -> List.of("athletics", "intimidation");
            case "criminal" -> List.of("deception", "stealth");
            case "sage" -> List.of("arcana", "history");
            case "acolyte" -> List.of("insight", "religion");
            case "noble" -> List.of("history", "persuasion");
            default -> List.of("animal-handling", "survival");
        };
        return List.of(classSkills.get(0), classSkills.get(1), backgroundSkills.get(0), backgroundSkills.get(1));
    }

    public List<String> defaultEquipmentChoices(String classIndex) {
        return switch (classIndex) {
            case "fighter" -> List.of("Chain Mail", "Longsword", "Shield", "Explorer's Pack");
            case "wizard" -> List.of("Quarterstaff", "Component Pouch", "Scholar's Pack");
            case "rogue" -> List.of("Rapier", "Shortbow", "Thieves' Tools", "Burglar's Pack");
            case "cleric" -> List.of("Mace", "Scale Mail", "Shield", "Holy Symbol");
            case "paladin" -> List.of("Chain Mail", "Martial Weapon", "Shield", "Holy Symbol");
            case "warlock" -> List.of("Light Crossbow", "Leather Armor", "Arcane Focus");
            default -> List.of("Adventurer's Pack", "Rations", "Bedroll");
        };
    }

    public List<String> defaultSpellChoices(String classIndex) {
        return switch (classIndex) {
            case "wizard" -> List.of("Mage Hand", "Fire Bolt", "Magic Missile", "Shield");
            case "cleric" -> List.of("Sacred Flame", "Guidance", "Cure Wounds", "Bless");
            case "warlock" -> List.of("Eldritch Blast", "Mage Hand", "Hex", "Armor of Agathys");
            default -> List.of();
        };
    }

    public int armorClassPreset(String classIndex) {
        return switch (classIndex) {
            case "barbarian" -> 14;
            case "fighter" -> 16;
            case "rogue" -> 14;
            case "wizard" -> 12;
            case "cleric" -> 16;
            case "ranger" -> 15;
            case "paladin" -> 18;
            case "warlock" -> 13;
            default -> 13;
        };
    }

    public Map<String, String> backgroundFallbacks() {
        return Map.of(
                "soldier", "Military Rank",
                "criminal", "Criminal Contact",
                "sage", "Researcher",
                "acolyte", "Shelter of the Faithful",
                "noble", "Position of Privilege",
                "folk-hero", "Rustic Hospitality"
        );
    }
}

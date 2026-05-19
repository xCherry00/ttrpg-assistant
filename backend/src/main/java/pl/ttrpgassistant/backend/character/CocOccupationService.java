package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CocOccupationService {

    public List<Map<String, Object>> occupations() {
        return List.of(
                occupation("antiquarian", "Antiquarian", 30, 70, List.of("history", "library-use", "appraise", "charm"), List.of("Notebook", "Magnifying glass", "Reference catalog")),
                occupation("doctor", "Doctor", 30, 80, List.of("medicine", "first-aid", "science-biology", "psychology"), List.of("Medical bag", "Stethoscope", "Notebook")),
                occupation("detective", "Detective", 20, 60, List.of("law", "psychology", "spot-hidden", "listen"), List.of("Revolver", "Notebook", "Flashlight")),
                occupation("journalist", "Journalist", 9, 30, List.of("library-use", "persuade", "psychology", "photography"), List.of("Camera", "Press pass", "Notebook")),
                occupation("professor", "Professor", 20, 70, List.of("library-use", "history", "language-own", "psychology"), List.of("Reference books", "Notes", "Pen")),
                occupation("private-investigator", "Private Investigator", 10, 40, List.of("law", "spot-hidden", "listen", "fighting-brawl"), List.of("Revolver", "Lock picks", "Notebook")),
                occupation("police-detective", "Police Detective", 20, 50, List.of("law", "firearms-handgun", "spot-hidden", "intimidate"), List.of("Sidearm", "Badge", "Notebook")),
                occupation("criminal", "Criminal", 5, 65, List.of("stealth", "locksmith", "fighting-brawl", "persuade"), List.of("Knife", "Lock picks", "Dark clothing")),
                occupation("occultist", "Occultist", 0, 30, List.of("occult", "history", "library-use", "psychology"), List.of("Occult tome", "Candles", "Ritual chalk")),
                occupation("soldier", "Soldier", 9, 30, List.of("firearms-rifle", "first-aid", "survival", "intimidate"), List.of("Service rifle", "First aid kit", "Uniform")),
                occupation("undertaker", "Undertaker", 20, 45, List.of("first-aid", "psychology", "occult", "persuade"), List.of("Mortuary tools", "Ledger", "Hearse keys")),
                occupation("artist", "Artist", 9, 50, List.of("art-craft", "psychology", "charm", "history"), List.of("Sketchbook", "Paint set", "Portfolio"))
        );
    }

    public Map<String, Object> occupationDetail(String index) {
        return occupations().stream()
                .filter(item -> index != null && index.equals(item.get("index")))
                .findFirst()
                .orElse(occupations().get(0));
    }

    private Map<String, Object> occupation(
            String index,
            String name,
            int creditRatingMin,
            int creditRatingMax,
            List<String> occupationSkills,
            List<String> suggestedEquipment
    ) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("index", index);
        out.put("name", name);
        out.put("creditRatingMin", creditRatingMin);
        out.put("creditRatingMax", creditRatingMax);
        out.put("occupationSkills", occupationSkills);
        out.put("suggestedEquipment", suggestedEquipment);
        return out;
    }
}

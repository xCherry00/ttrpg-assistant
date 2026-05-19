package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.character.dto.CreateCocQuickCharacterRequest;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class CocCharacterSheetService {

    private final CocCharacterDefaultsService defaultsService;
    private final CocOccupationService occupationService;

    public CocCharacterSheetService(CocCharacterDefaultsService defaultsService, CocOccupationService occupationService) {
        this.defaultsService = defaultsService;
        this.occupationService = occupationService;
    }

    public Map<String, Object> generate(CreateCocQuickCharacterRequest request) {
        Map<String, Object> occupation = occupationService.occupationDetail(request.occupationIndex());
        String firstName = defaultsService.firstNameOrRandom(request.firstName());
        String lastName = defaultsService.lastNameOrRandom(request.lastName());
        int age = defaultsService.ageOrRandom(request.age());
        String sex = defaultsService.sexOrRandom(request.sex());
        String fullName = firstName + " " + lastName;
        String occupationName = String.valueOf(occupation.getOrDefault("name", "Investigator"));

        int str = defaultsService.rollStdCharacteristic();
        int con = defaultsService.rollStdCharacteristic();
        int siz = defaultsService.rollLargeCharacteristic();
        int dex = defaultsService.rollStdCharacteristic();
        int app = defaultsService.rollStdCharacteristic();
        int intel = defaultsService.rollLargeCharacteristic();
        int pow = defaultsService.rollStdCharacteristic();
        int edu = defaultsService.rollLargeCharacteristic();

        Map<String, Object> characteristics = new LinkedHashMap<>();
        characteristics.put("STR", characteristicRow(str));
        characteristics.put("CON", characteristicRow(con));
        characteristics.put("SIZ", characteristicRow(siz));
        characteristics.put("DEX", characteristicRow(dex));
        characteristics.put("APP", characteristicRow(app));
        characteristics.put("INT", characteristicRow(intel));
        characteristics.put("POW", characteristicRow(pow));
        characteristics.put("EDU", characteristicRow(edu));

        int hp = Math.max(1, (con + siz) / 10);
        int mp = Math.max(1, pow / 5);
        int san = pow;
        int luck = defaultsService.rollLuck();
        int dodge = dex / 2;
        int languageOwn = edu;
        int build = buildFromStrSiz(str, siz);
        String damageBonus = damageBonusFromBuild(build);
        int move = moveFromDexStrSiz(dex, str, siz);
        int creditRatingMin = intValue(occupation.get("creditRatingMin"), 20);
        int creditRatingMax = intValue(occupation.get("creditRatingMax"), 40);
        int creditRating = defaultsService.pickCreditRating(creditRatingMin + "-" + creditRatingMax);

        List<Map<String, Object>> skills = buildSkills(occupation, dodge, languageOwn, creditRating);

        Map<String, Object> sheet = new LinkedHashMap<>();
        sheet.put("system", "COC7E");
        sheet.put("identity", Map.of(
                "name", fullName,
                "firstName", firstName,
                "lastName", lastName,
                "age", age,
                "sex", sex,
                "occupation", occupationName,
                "occupationIndex", String.valueOf(occupation.getOrDefault("index", "antiquarian")),
                "portraitUrl", request.portraitUrl() == null ? "" : request.portraitUrl()
        ));
        sheet.put("characteristics", characteristics);
        sheet.put("derived", Map.of(
                "hp", hp,
                "mp", mp,
                "san", san,
                "luck", luck,
                "damageBonus", damageBonus,
                "build", build,
                "move", move
        ));
        sheet.put("skills", skills);
        sheet.put("combat", Map.of(
                "dodge", dodge,
                "weapons", List.of(
                        Map.of("name", "Fighting (Brawl)", "skill", 25, "damage", "1d3 + DB"),
                        Map.of("name", "Handgun", "skill", 20, "damage", "1d10")
                )
        ));
        sheet.put("equipment", Map.of(
                "cash", creditRating * 10,
                "assets", creditRating * 200,
                "spendingLevel", Math.max(1, creditRating / 10),
                "items", occupation.getOrDefault("suggestedEquipment", List.of())
        ));
        sheet.put("backstory", Map.of(
                "personalDescription", "",
                "ideologyBeliefs", "",
                "significantPeople", "",
                "meaningfulLocations", "",
                "treasuredPossessions", "",
                "traits", "",
                "injuriesScars", "",
                "phobiasManias", "",
                "arcaneTomesSpellsArtifacts", "",
                "encountersWithStrangeEntities", ""
        ));
        sheet.put("notes", Map.of(
                "keeperNotes", "",
                "privateNotes", ""
        ));
        return sheet;
    }

    private List<Map<String, Object>> buildSkills(Map<String, Object> occupation, int dodge, int languageOwn, int creditRating) {
        Map<String, Integer> base = new LinkedHashMap<>(defaultsService.baseSkills());
        base.put("dodge", dodge);
        base.put("language-own", languageOwn);
        base.put("credit-rating", creditRating);

        List<String> occupationSkills = new ArrayList<>();
        Object rawSkills = occupation.get("occupationSkills");
        if (rawSkills instanceof List<?> list) {
            for (Object skill : list) {
                occupationSkills.add(String.valueOf(skill));
            }
        }
        for (String key : occupationSkills) {
            int current = base.getOrDefault(key, 15);
            base.put(key, Math.min(80, current + 25));
        }

        List<Map<String, Object>> out = new ArrayList<>();
        base.forEach((key, value) -> out.add(Map.of(
                "name", skillLabel(key),
                "key", key,
                "value", value,
                "half", value / 2,
                "fifth", Math.max(1, value / 5)
        )));
        return out;
    }

    private Map<String, Object> characteristicRow(int value) {
        return Map.of(
                "value", value,
                "half", value / 2,
                "fifth", Math.max(1, value / 5)
        );
    }

    private int buildFromStrSiz(int str, int siz) {
        int sum = str + siz;
        if (sum < 65) return -2;
        if (sum < 85) return -1;
        if (sum < 125) return 0;
        if (sum < 165) return 1;
        return 2;
    }

    private String damageBonusFromBuild(int build) {
        return switch (build) {
            case -2 -> "-2";
            case -1 -> "-1";
            case 0 -> "0";
            case 1 -> "+1d4";
            default -> "+1d6";
        };
    }

    private int moveFromDexStrSiz(int dex, int str, int siz) {
        if (dex < siz && str < siz) return 7;
        if (dex > siz && str > siz) return 9;
        return 8;
    }

    private String skillLabel(String key) {
        return switch (key) {
            case "cthulhu-mythos" -> "Cthulhu Mythos";
            case "fighting-brawl" -> "Fighting (Brawl)";
            case "firearms-handgun" -> "Firearms (Handgun)";
            case "first-aid" -> "First Aid";
            case "spot-hidden" -> "Spot Hidden";
            case "library-use" -> "Library Use";
            case "language-own" -> "Language (Own)";
            case "credit-rating" -> "Credit Rating";
            default -> key.replace('-', ' ');
        };
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        return fallback;
    }
}

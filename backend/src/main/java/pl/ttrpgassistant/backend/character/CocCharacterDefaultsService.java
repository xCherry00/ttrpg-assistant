package pl.ttrpgassistant.backend.character;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class CocCharacterDefaultsService {

    private static final List<String> FIRST_NAMES = List.of("Anna", "Edward", "Lucille", "Victor", "Helen", "Samuel", "Irene", "Robert");
    private static final List<String> LAST_NAMES = List.of("Blackwood", "Carter", "Davis", "Parker", "Wright", "Mills", "Bennett", "Price");
    private static final List<String> SEXES = List.of("Female", "Male");
    private static final List<Integer> THREE_D6_X5 = List.of(15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90);
    private static final List<Integer> TWO_D6_PLUS_SIX_X5 = List.of(40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90);
    private static final Random RNG = new Random();

    public String firstNameOrRandom(String value) {
        if (value != null && !value.isBlank()) return value.trim();
        return pick(FIRST_NAMES);
    }

    public String lastNameOrRandom(String value) {
        if (value != null && !value.isBlank()) return value.trim();
        return pick(LAST_NAMES);
    }

    public int ageOrRandom(Integer value) {
        if (value != null) return Math.max(15, Math.min(95, value));
        return randBetween(21, 58);
    }

    public String sexOrRandom(String value) {
        if (value != null && !value.isBlank()) return value.trim();
        return pick(SEXES);
    }

    public int rollStdCharacteristic() {
        return pick(THREE_D6_X5);
    }

    public int rollLargeCharacteristic() {
        return pick(TWO_D6_PLUS_SIX_X5);
    }

    public int rollLuck() {
        return pick(THREE_D6_X5);
    }

    public int pickCreditRating(String range) {
        if (range == null || !range.contains("-")) return 20;
        String[] parts = range.split("-");
        try {
            int min = Integer.parseInt(parts[0].trim());
            int max = Integer.parseInt(parts[1].trim());
            return randBetween(min, max);
        } catch (Exception ignored) {
            return 20;
        }
    }

    public Map<String, Integer> baseSkills() {
        return Map.of(
                "cthulhu-mythos", 0,
                "fighting-brawl", 25,
                "firearms-handgun", 20,
                "first-aid", 30,
                "spot-hidden", 25,
                "listen", 20,
                "library-use", 20
        );
    }

    private int randBetween(int min, int max) {
        if (max <= min) return min;
        return min + RNG.nextInt(max - min + 1);
    }

    private <T> T pick(List<T> values) {
        return values.get(RNG.nextInt(values.size()));
    }
}

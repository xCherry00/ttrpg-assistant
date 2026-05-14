package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class FoodQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String GENERATOR = "food_quick";
    private static final String VARIANT = "general.quick";
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return GENERATOR.equals(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String foodType = stringParam(params, "foodType", "Losowy");

        List<GeneratorOutputSection> sections = randomChoice(foodType) ? randomMeal() : mealFor(foodType);

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, "Jedzenie", "Szybki posilek lub napoj", sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomMeal() {
        return switch (random.nextInt(5)) {
            case 0 -> mealFor("Sniadanie");
            case 1 -> mealFor("Danie glowne");
            case 2 -> mealFor("Zupa");
            case 3 -> mealFor("Napoj bezalkoholowy");
            default -> mealFor("Napoj alkoholowy");
        };
    }

    private List<GeneratorOutputSection> mealFor(String foodType) {
        String key = normalize(foodType);
        return switch (key) {
            case "sniadanie", "breakfast" -> withOptionalPrice("Owsianka Podroznika", "Gesty owies z jablkiem, orzechami i miodem.");
            case "zupa", "soup" -> withOptionalPrice("Zupa Dymna", "Bulion warzywny z wedzona papryka i swiezym pieczywem.");
            case "danie glowne", "main course", "main" -> withOptionalPrice("Pieczen Traktu", "Wolowina pieczona z cebula, marchewka i sosem z ziol.");
            case "deser", "dessert" -> withOptionalPrice("Kruszonka z Sadu", "Cieple owoce pod warstwa maslanej kruszonki.");
            case "napoj bezalkoholowy", "non-alcoholic drink", "non alcoholic drink" -> withOptionalPrice("Mietowa Lemoniada", "Lekki napoj z mieta, cytryna i odrobina miodu.");
            case "napoj alkoholowy", "alcoholic drink" -> withOptionalPrice("Ciemne Piwo Karczmarza", "Pelne, lekko gorzkie, z nuta karmelu.");
            default -> withOptionalPrice("Posilek Dnia", "Proste jedzenie, ale swieze i sycace.");
        };
    }

    private List<GeneratorOutputSection> withOptionalPrice(String name, String description) {
        if (random.nextBoolean()) {
            return List.of(
                    section("Nazwa", name),
                    section("Opis", description),
                    section("Cena", pick("3 cp", "7 cp", "1 sp", "2 sp", "4 sp"))
            );
        }
        return List.of(section("Nazwa", name), section("Opis", description));
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean randomChoice(String value) {
        String normalized = normalize(value);
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random");
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase().trim();
    }
}


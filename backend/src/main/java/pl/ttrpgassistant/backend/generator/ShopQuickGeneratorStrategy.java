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
public class ShopQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String GENERATOR = "shop_quick";
    private static final String VARIANT = "general.quick";
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return GENERATOR.equals(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String shopType = stringParam(params, "shopType", "Losowy");

        List<GeneratorOutputSection> sections = randomChoice(shopType) ? randomShop() : shopFor(shopType);

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, "Sklep", "Szybki generator sklepu i handlu", sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomShop() {
        return switch (random.nextInt(5)) {
            case 0 -> shopFor("Karczma i zajazd");
            case 1 -> shopFor("Sklep ogolny");
            case 2 -> shopFor("Kowal");
            case 3 -> shopFor("Zielarz");
            default -> shopFor("Magiczne dobra");
        };
    }

    private List<GeneratorOutputSection> shopFor(String shopType) {
        String name = switch (normalize(shopType)) {
            case "karczma i zajazd", "inn & tavern" -> "Pod Trzema Latarniami";
            case "sklep ogolny", "general store" -> "Sklad Pod Roznym Towarem";
            case "kowal", "blacksmith" -> "Kuznia Iskier";
            case "zielarz", "herbalist" -> "Ziolowy Zakatek";
            case "magiczne dobra", "magic" -> "Szafka Arkanow";
            default -> "Handlowa Przystan";
        };

        List<GeneratorOutputSection> base = List.of(
                section("Nazwa", name),
                section("Typ", shopType),
                section("Wlasciciel", pick("Mira, byla zwiadowczyni", "Orven, cierpliwy rzemieslnik", "Dalia, kupczyni z pamiecia do twarzy")),
                section("Oferta dnia", pick("10% taniej na podstawowe racje", "drugi drobiazg pol ceny", "jedna usluga identyfikacji gratis", "ostrzenie broni bez oplaty przy wiekszym zakupie"))
        );

        if (random.nextBoolean()) {
            return List.of(
                    base.get(0), base.get(1), base.get(2), base.get(3),
                    section("Problem sklepu", pick("dostawa nie dotarla na czas", "konkurencja podbiera stalych klientow", "ktos placi falszywa moneta", "w nocy ginie towar z zaplecza"))
            );
        }
        return base;
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

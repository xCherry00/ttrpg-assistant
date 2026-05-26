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
        String shopMood = stringParam(params, "shopMood", "Losowy");

        List<GeneratorOutputSection> sections = randomChoice(shopType) ? randomShop(shopMood) : shopFor(shopType, shopMood);
        String title = sectionContent(sections, "Nazwa", "Sklep / Handel");
        String subtitle = sectionContent(sections, "Typ i klimat", "Sklep / Handel");

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, title, subtitle, sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomShop(String shopMood) {
        return switch (random.nextInt(5)) {
            case 0 -> shopFor("Antykwariat", shopMood);
            case 1 -> shopFor("Sklep ogolny", shopMood);
            case 2 -> shopFor("Kowal", shopMood);
            case 3 -> shopFor("Zielarz", shopMood);
            default -> shopFor("Kram z osobliwosciami", shopMood);
        };
    }

    private List<GeneratorOutputSection> shopFor(String shopType, String shopMood) {
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
                section("Typ i klimat", shopType + " | " + (randomChoice(shopMood) ? pick("Zwyczajny", "Podejrzany", "Ekskluzywny", "Zaniedbany", "Tajemniczy", "Objazdowy", "Nielegalny") : shopMood)),
                section("Wlasciciel", pick("Mira, byla zwiadowczyni", "Orven, cierpliwy rzemieslnik", "Dalia, kupczyni z pamiecia do twarzy")),
                section("Oferta dnia", pick("10% taniej na podstawowe racje", "drugi drobiazg pol ceny", "jedna usluga identyfikacji gratis", "ostrzenie broni bez oplaty przy wiekszym zakupie")),
                section("Specjalny towar", pick("mapa kanalow", "swieca palaca sie niebieskim plomieniem", "zamknieta szkatulka bez klucza", "kompas wskazujacy osobe zamiast polnocy", "pudelko z czarnym piaskiem"))
        );

        return List.of(
                base.get(0), base.get(1), base.get(2), base.get(3),
                base.get(4),
                section("Problem sklepu", pick("Wlasciciel jest szantazowany.", "Towar znika noca.", "Sklep ma ukryte zaplecze.", "Towar dnia jest przeklety.", "Na zapleczu ukrywa sie ranny czlowiek."))
        );
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

    private String sectionContent(List<GeneratorOutputSection> sections, String title, String fallback) {
        return sections.stream()
                .filter(section -> title.equals(section.title()))
                .map(GeneratorOutputSection::content)
                .filter(content -> content != null && !content.isBlank())
                .findFirst()
                .orElse(fallback);
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase().trim();
    }
}

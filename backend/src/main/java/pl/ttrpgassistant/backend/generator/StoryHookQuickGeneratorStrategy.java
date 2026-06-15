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
public class StoryHookQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String GENERATOR = "story_hook_quick";
    private static final String VARIANT = "general.quick";
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return GENERATOR.equals(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String storyType = stringParam(params, "storyType", "Losowy");
        String reliability = stringParam(params, "rumorReliability", "Losowa");
        String source = stringParam(params, "rumorSource", "Losowe");
        List<GeneratorOutputSection> sections = withRumorContext(randomChoice(storyType) ? randomType() : forType(storyType), reliability, source);

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, "Fabula i pogłoski", "Haki fabularne i pogłoski", sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomType() {
        return switch (random.nextInt(7)) {
            case 0 -> forType("Pogłoska");
            case 1 -> forType("Zlecenie");
            case 2 -> forType("List gonczy");
            case 3 -> forType("Choroba");
            case 4 -> forType("Zaginiona osoba");
            case 5 -> forType("Dziwne zjawisko");
            default -> forType("Sekret frakcji");
        };
    }

    private List<GeneratorOutputSection> forType(String type) {
        return switch (normalize(type)) {
            case "pogłoska", "rumour", "rumor" -> List.of(
                    section("Pogłoska", "Podobno pod starym mostem spotykaja sie ludzie, ktorzy kupuja cudze nazwiska.")
            );
            case "zlecenie", "bounty", "quest" -> List.of(
                    section("Treść", "Potrzebna dyskretna ochrona transportu bez pytan o ladunek."),
                    section("Zleceniodawca", "Herta z cechu przewoznikow"),
                    section("Nagroda", "120 gp oraz list polecąjacy")
            );
            case "list gonczy", "wanted" -> List.of(
                    section("Cel", "Rivan Czarny Plaszcz"),
                    section("Przewinienie", "Napad na magazyn i porwanie ksiegowego"),
                    section("Nagroda", "300 gp za żywego, 150 gp za potwierdzenie śmierci")
            );
            case "choroba", "disease" -> List.of(
                    section("Nazwa", "Szary kaszel"),
                    section("Objawy", "Goraczka, suchy kaszel, oslabienie i bezsennosc"),
                    section("Zarazliwosc", "Wysoka w zamknietych, wilgotnych pomieszczeniach")
            );
            case "zaginiona osoba", "missing person" -> List.of(
                    section("Osoba", "Lina, corka lokalnego karczmarza"),
                    section("Okolicznosci", "Zniknela po wyjsciu na poranny targ"),
                    section("Trop", "Na straganie zostal tylko urwany kawalek niebieskiej wstazki")
            );
            case "dziwne zjawisko", "strange phenomenon" -> List.of(
                    section("Zjawisko", "W nocy słychać dzwony, mimo ze wieza jest zawalona"),
                    section("Miejsce", "Stare nabrzeze przy zamknietej świątyni"),
                    section("Możliwe wyjaśnienie", "Ktoś uruchamia ukryty mechanizm, by odstraszać świadków")
            );
            case "sekret frakcji", "faction secret" -> List.of(
                    section("Frakcja", "Bractwo Bialej Pieczeci"),
                    section("Sekret", "Od lat podmieniaja oficjalne dokumenty handlowe"),
                    section("Konsekwencja", "Ujawnienie sekretu może wywolac otwarty konflikt kupcow")
            );
            default -> List.of(section("Pogłoska", "W mieście krazy historia o czyms, co wraca zawsze przed nowiem."));
        };
    }

    private List<GeneratorOutputSection> withRumorContext(List<GeneratorOutputSection> base, String reliability, String source) {
        String resólvedReliability = randomChoice(reliability) ? pick("Prawdziwa", "Przesadzona", "Fałszywa", "Częściowo prawdziwa", "Celowo rozsiana") : reliability;
        String resólvedSource = randomChoice(source) ? pick("Karczma", "Straz miejska", "Dziecko", "Kupiec", "Kaplan", "List", "Tablica ogłoszen", "Podsluchana rozmowa") : source;
        return List.of(
                section("Źródło", resólvedSource),
                section("Poziom wiarygodnosci", resólvedReliability),
                base.get(0),
                section("Co jest prawda", "W plotce jest przynajmniej jeden sprawdzalny szczegol: miejsce, nazwisko albo znak."),
                section("Co jest znieksztalcone", "Skala problemu albo motyw osoby zaangazowanej zostały opowiedziane wygodniej niż w rzeczywistosci."),
                section("Jak gracze mogą to sprawdzic", "Niech porownaja relacje z dokumentem, swiadkiem albo śladem w miejscu zdarzenia.")
        );
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
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("losowe") || normalized.equals("random");
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase().trim();
    }
}

package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@Component
public class PracticalQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String VARIANT = "general.quick";
    private static final Set<String> SUPPORTED = Set.of("encounter_quick", "complication_quick", "document_quick");
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return SUPPORTED.contains(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        return generate("encounter_quick", VARIANT, request);
    }

    @Override
    public GeneratorStructuredResultResponse generate(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        return switch (generatorCode) {
            case "complication_quick" -> complication(params);
            case "document_quick" -> document(params);
            default -> encounter(params);
        };
    }

    private GeneratorStructuredResultResponse encounter(Map<String, Object> params) {
        String setting = choice(params, "setting", "Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny");
        String place = choice(params, "place", "Miasto", "Droga", "Las", "Loch", "Karczma", "Ruiny", "Port", "Cmentarz");
        String dangerLevel = stringParam(params, "dangerLevel", "Średnie");
        String tone = choice(params, "tone", "Walka", "Rozmowa", "Tajemnica", "Zasadzka", "Problem moralny", "Poscig", "Handel", "Ratunek");
        String participants = pick(
                "przestraszony kupiec i jego ochrona",
                "ranny zwiadowca",
                "patrol strazy",
                "grupa kultystow w przebraniu",
                "podroznik z falszywa mapa",
                "poslaniec z zakrwawionym listem",
                "zbiegly wiezien",
                "grupa pielgrzymow"
        );

        List<GeneratorOutputSection> sections = List.of(
                stats(item("Setting", setting), item("Miejsce", place), item("Zagrożenie", dangerLevel), item("Ton", tone)),
                section("Co sie dzieje?", "W miejscu typu " + place + " bohaterowie trafiaja na sytuacje, która wygląda rutynowo tylko przez pierwsza minute."),
                section("Kto bierze udzial?", participants + "."),
                section("Czego chca?", pick("Chca bezpiecznie opuscic scene.", "Potrzebuja swiadka albo pośrednika.", "Probuja ukryć prawdziwy cel spotkania.", "Szukaja kogos, kto zniknął tuz przed przybyciem drużyny.")),
                section("Komplikacja", pick("Przybywa trzecia strona.", "Ktos rozpoznaje jednego z bohaterow.", "Przedmiot znika w trakcie zamieszania.", "Pomoc jednej stronie pogorszy relacje z druga.")),
                section("Nagroda / konsekwencja", pick("Wdzięcznosc daje kontakt i trop.", "Zignorowanie sceny sprawia, ze problem wraca w gorszej formie.", "Na miejscu zostaje dowod prowadzacy do kolejnego wątku."))
        );

        return result("encounter_quick", "Spotkanie: " + place, setting + " | " + dangerLevel + " | " + tone, sections);
    }

    private GeneratorStructuredResultResponse complication(Map<String, Object> params) {
        String sceneType = choice(params, "sceneType", "Walka", "Rozmowa", "Śledztwo", "Podróż", "Handel", "Odpoczynek", "Rytuał", "Pościg", "Infiltracja");
        String severity = stringParam(params, "severity", "Średnia");
        String tone = choice(params, "tone", "Komediowa", "Mroczna", "Dramatyczna", "Chaotyczna", "Taktyczna", "Spoleczna");
        String complication = pick(
                "pojawia sie trzecia strona konfliktu",
                "swiadek ucieka",
                "cel sceny okazuje sie falszywy",
                "nagle gasnie światło",
                "straz pojawia sie za wczesnie",
                "stary wrog proponuje pomoc",
                "pojawia sie niewinny zakladnik",
                "odkryty trop prowadzi do sprzecznych wnioskow"
        );

        List<GeneratorOutputSection> sections = List.of(
                stats(item("Typ sceny", sceneType), item("Skala", severity), item("Ton", tone)),
                section("Komplikacja", complication + "."),
                section("Natychmiastowy efekt", pick("Scena wymaga decyzji teraz, zanim sytuacja sie rozleje.", "Dotychczasowy plan nadal działa, ale ma nowy koszt.", "Jedna postać niezależna zmienia priorytety.")),
                section("Ukryta przyczyna", pick("Ktos przygotowal to wczesniej.", "To skutek uboczny poprzedniej decyzji graczy.", "Neutralny NPC ujawnia wlasny interes.")),
                section("Jak gracze mogą to wykorzystać?", pick("Mogą odwrócic uwage przeciwnikow.", "Mogą wymusic szybkie wyznanie.", "Mogą zyskac dowod, kontakt albo przewage pozycyjna."))
        );

        return result("complication_quick", "Komplikacja sceny", sceneType + " | " + severity + " | " + tone, sections);
    }

    private GeneratorStructuredResultResponse document(Map<String, Object> params) {
        String documentType = choice(params, "documentType", "List", "Dzieńnik", "Ksiega", "Rachunek", "Akt wlasnosci", "Raport", "Mapa", "Telegram", "Zeznanie", "Kontrakt");
        String tone = choice(params, "tone", "Zwykly", "Tajemniczy", "Grozny", "Urzedowy", "Okultystyczny", "Osobisty", "Zaszyfrowany", "Zniszczony");
        String setting = choice(params, "setting", "Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny");
        String title = pick("List bez podpisu", "Mapa z poprawkami", "Raport bez pieczeci", "Nekrolog osoby, która zyje", "Kontrakt z brakujacym nazwiskiem");

        List<GeneratorOutputSection> sections = List.of(
                stats(item("Typ dokumentu", documentType), item("Ton", tone), item("Setting", setting)),
                section("Naglowek / tytuł", title),
                section("Autor", pick("osoba podpisana inicjalami", "urzędnik, który zniknął", "swiadek piszacy cudzym charakterem", "ktoś, kto zna lokalny sekret")),
                section("Fragment treśći", pick("Nie ufaj godzinie zapisanej w aktach.", "Drugi klucz nie otwiera drzwi, tylko skrzynke.", "Nazwisko powtarza sie w każdej wersji sprawy.", "Jesli dokument dotrze za pozno, spal mape.")),
                section("Ukryte znaczenie", pick("Dokument wskazuje wlasciwe miejsce, ale zly powod.", "Najważniejszy jest podpis, nie treść.", "Brakujacy fragment można odtworzyc z kontekstu.")),
                section("Komu zależy na dokumencie?", pick("lokalnej frakcji", "osobie z oficjalnym alibi", "rodzinie z dawnym długiem", "komus, kto pilnuje archiwum"))
        );

        return result("document_quick", "Dokument / Znalezisko", documentType + " | " + setting + " | " + tone, sections);
    }

    private GeneratorStructuredResultResponse result(String code, String title, String subtitle, List<GeneratorOutputSection> sections) {
        return new GeneratorStructuredResultResponse(null, code, VARIANT, title, subtitle, sections, "seed", OffsetDateTime.now());
    }

    private GeneratorOutputSection stats(Map<String, Object>... items) {
        return new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(items));
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private Map<String, Object> item(String label, Object value) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("label", label);
        item.put("value", value);
        return item;
    }

    private String choice(Map<String, Object> params, String key, String... fallbackValues) {
        String value = stringParam(params, key, "Losowy");
        return randomChoice(value) ? pick(fallbackValues) : value;
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("losowe") || normalized.equals("random") || normalized.isBlank();
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }
}

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
public class GenreQuickGeneratorStrategy implements GeneratorStrategy {
    private static final Set<String> HORROR = Set.of("npc_horror", "clue", "cult_horror", "horror_creature");
    private static final Set<String> POSTAPO = Set.of("survivor", "shelter", "supply_run", "zombie_variant");
    private static final Set<String> SCIFI = Set.of("npc_scifi", "planet", "space_station", "anomaly");

    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return (HORROR.contains(generatorCode) && "horror.quick".equals(variantCode))
                || (POSTAPO.contains(generatorCode) && "postapo.quick".equals(variantCode))
                || (SCIFI.contains(generatorCode) && "scifi.quick".equals(variantCode));
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        return generate("npc_horror", "horror.quick", request);
    }

    @Override
    public GeneratorStructuredResultResponse generate(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String category = category(generatorCode);
        String tone = stringParam(params, "tone", defaultTone(category));
        String system = stringParam(params, "system", "system_agnostic");
        String title = titleFor(generatorCode);

        return new GeneratorStructuredResultResponse(
                null,
                generatorCode,
                variantCode,
                title,
                labelFor(generatorCode) + " - " + category + " - " + displayTone(tone),
                sectionsFor(generatorCode, params, category, tone, system, title),
                "seed",
                OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> sectionsFor(String code, Map<String, Object> params, String category, String tone, String system, String title) {
        return switch (code) {
            case "npc_horror" -> List.of(
                    stats(category, tone, system, "Rola", stringParam(params, "role", "Losowa")),
                    section("Wyglad", title + " wyglada jak osoba, ktora od dawna nie spi spokojnie. Jeden detal zdradza kontakt z tajemnica."),
                    section("Zachowanie", pick("mowi zbyt cicho i ciagle nasluchuje", "odpowiada zanim pytanie zostanie dokonczone", "unika luster, okien i fotografii")),
                    section("Co ukrywa", pick("widzial prawdziwe zrodlo zjawiska", "pomogl zakopac pierwszy dowod", "nie jest pewien, czy jego wspomnienia sa jego wlasne")),
                    section("Jak moze zaszkodzic", "Pod presja poda niepelna prawde albo skieruje graczy do miejsca, ktore samo jest pulapka.")
            );
            case "clue" -> List.of(
                    stats(category, tone, system, "Typ tropu", stringParam(params, "clueType", "Losowy")),
                    section("Wskazowka", title + " wyglada niewinnie, ale nie pasuje do oficjalnej wersji wydarzen."),
                    section("Gdzie ja znalezc", pick("pod warstwa kurzu w zamknietym pokoju", "przy ciele, ale nie tam, gdzie powinna lezec", "w notatniku, ktory ma wyrwane ostatnie strony")),
                    section("Co sugeruje", pick("sprawca znal ofiare", "rytual zaczal sie wczesniej niz wszyscy mysla", "swiadek klamie z dobrego powodu")),
                    section("Bledna interpretacja", "Jesli gracze pojda za pierwszym wrazeniem, dotra do osoby niewinnej, ale powiazanej z prawda.")
            );
            case "cult_horror" -> List.of(
                    stats(category, tone, system, "Zasieg", stringParam(params, "scope", "Lokalny")),
                    section("Wierzenia", title + " wierzy, ze strach jest forma objawienia, a prawda musi zostac ukryta przed niegotowymi."),
                    section("Lider", pick("uprzejmy lekarz znany w calej okolicy", "wdowa prowadzaca dom sierot", "archiwista, ktory niszczy tylko wybrane dokumenty")),
                    section("Rytual", pick("powtarza sie przy kazdej pelni", "wymaga ciszy calej dzielnicy", "zaczyna sie od publicznego aktu dobroci")),
                    section("Slabosc", "Kult nie boi sie przemocy, ale boi sie ujawnienia sprzecznosci w swoich wierzeniach.")
            );
            case "horror_creature" -> List.of(
                    stats(category, tone, system, "Widocznosc", stringParam(params, "visibilityLevel", "Czesciowa")),
                    section("Wyglad", title + " nigdy nie jest widziany w calosci. Swiadkowie zapamietuja tylko fragment: glos, zapach albo ruch."),
                    section("Slady obecnosci", pick("mokre odciski na suchym drewnie", "zwierzeta patrzace w puste miejsce", "zdjecia z jedna rozmazana sylwetka")),
                    section("Sposob dzialania", pick("izoluje ofiare od grupy", "powtarza glosy bliskich", "pojawia sie dopiero, gdy ktos sklamie")),
                    section("Jak przetrwac", "Niech gracze poznaja zasade zachowania stworzenia. Walka moze byc opcja, ale zrozumienie powinno dac przewage.")
            );
            case "survivor" -> List.of(
                    stats(category, tone, system, "Rola", stringParam(params, "role", "Losowa")),
                    section("Wyglad", title + " nosi rzeczy naprawiane wiele razy i trzyma najcenniejszy przedmiot blisko ciala."),
                    section("Umiejetnosc przetrwania", pick("zna bezpieczne przejscia przez ruiny", "potrafi filtrowac wode z byle czego", "rozpoznaje ludzi po sladach obozu")),
                    section("Trauma", pick("nie wchodzi do ciemnych pomieszczen", "liczy naboje nawet podczas rozmowy", "nie ufa nikomu, kto obiecuje schronienie")),
                    section("Czego chce", "Potrzebuje pomocy, ale nie powie od razu, jaki koszt poniosla poprzednia grupa.")
            );
            case "shelter" -> List.of(
                    stats(category, tone, system, "Typ schronienia", stringParam(params, "shelterType", "Losowy")),
                    section("Opis", title + " jest bezpieczne tylko na pierwszy rzut oka. Kazde zabezpieczenie wymaga zasobu, ktorego zaczyna brakowac."),
                    section("Zabezpieczenia", pick("podwojne drzwi i obserwator na dachu", "system dzwonkow z puszek", "stare kamery dzialajace na resztkach pradu")),
                    section("Slaby punkt", pick("jedno wejscie zna ktos spoza grupy", "filtr powietrza wymaga wymiany", "wewnatrz narasta konflikt o racje")),
                    section("Sekret", "Schronienie istnieje, bo ktos kiedys zamknal przed drzwiami ludzi proszacych o pomoc.")
            );
            case "supply_run" -> List.of(
                    stats(category, tone, system, "Cel wyprawy", stringParam(params, "supplyGoal", "Losowy")),
                    section("Lokacja", title + " znajduje sie w miejscu, ktore bylo codzienne przed upadkiem, a teraz jest pelne zlych skojarzen."),
                    section("Zasoby", pick("leki i opatrunki", "paliwo w zamknietym agregacie", "konserwy w zalanym magazynie")),
                    section("Komplikacja", pick("inna grupa przybywa w tym samym czasie", "zapas jest skazony albo uszkodzony", "powrot jest trudniejszy niz wejscie")),
                    section("Konsekwencja porazki", "Brak zasobu uderza w konkretna osobe albo relacje w bazie, nie tylko w licznik ekwipunku.")
            );
            case "zombie_variant" -> List.of(
                    stats(category, tone, system, "Zagrozenie", stringParam(params, "threatLevel", "Srednie")),
                    section("Wyglad", title + " zdradza sposob smierci albo mutacji. Gracze powinni rozpoznac wariant po jednym mocnym detalu."),
                    section("Zachowanie", pick("reaguje na cieplo, nie na dzwiek", "porusza sie tylko stadnie", "udaje bezruch, dopoki ktos nie podejdzie")),
                    section("Jak go unikac", pick("niski halas nie wystarczy, trzeba ukryc zapach", "nie wchodzic w waskie przejscia", "odciagnac go swiatlem albo drganiami")),
                    section("Scena", "Pokaz wariant najpierw na ofierze lub sladach, zanim zaatakuje druzyne.")
            );
            case "npc_scifi" -> List.of(
                    stats(category, tone, system, "Rola", stringParam(params, "role", "Losowa")),
                    section("Identyfikator", title + " funkcjonuje w systemie pod rola sluzbowa, ale prywatnie uzywa innego imienia."),
                    section("Funkcja", pick("technik odpowiedzialny za zamkniety modul", "kurier z nielegalnym ladunkiem", "analityk, ktory znalazl blad w danych")),
                    section("Sekret", pick("jest kopia zapasowa kogos innego", "sprzedaje dane korporacji", "ukrywa objawy kontaktu z anomalia")),
                    section("Konflikt", "NPC moze pomoc, ale jego problem techniczny albo prawny przejdzie na druzyne.")
            );
            case "planet" -> List.of(
                    stats(category, tone, system, "Typ planety", stringParam(params, "planetType", "Losowy")),
                    section("Srodowisko", title + " ma jeden dominujacy problem: pogoda, toksycznosc, grawitacje albo brak zaufania kolonistow."),
                    section("Kolonia", pick("kopalnia kontrolowana przez kontrakt", "naukowa baza bez aktualnych raportow", "port na granicy legalnej przestrzeni")),
                    section("Zasob", pick("rzadki mineral", "biologiczna probka", "stare dane nawigacyjne")),
                    section("Tajemnica", "Oficjalna mapa planety pomija miejsce, ktore widac z orbity.")
            );
            case "space_station" -> List.of(
                    stats(category, tone, system, "Stan", stringParam(params, "state", "Losowy")),
                    section("Funkcja", title + " mialo byc miejscem pracy, ale teraz kazda sekcja ma inne zasady przetrwania."),
                    section("Sekcje", pick("dok, hydroponika i stary modul mieszkalny", "laboratorium, rdzen danych i opuszczony hangar", "kaplica, areszt i komora lacznosci")),
                    section("Problem", pick("zanika lacznosc wewnetrzna", "jedna sekcja nie odpowiada", "system podtrzymywania zycia klamie w raportach")),
                    section("Sekret", "Stacja nadal wykonuje rozkaz, ktorego nikt z obecnej zalogi nie zna.")
            );
            default -> List.of(
                    stats(category, tone, system, "Stabilnosc", stringParam(params, "stability", "Niestabilna")),
                    section("Opis", title + " lamie intuicyjne zasady miejsca, w ktorym wystepuje."),
                    section("Pierwsze objawy", pick("zegary rozjezdzaja sie o kilka minut", "ludzie pamietaja inne wersje rozmow", "czujniki pokazuja ksztalt, ktorego nie ma")),
                    section("Efekt", pick("zmienia priorytety systemow", "przyciaga sygnaly z nieznanego zrodla", "tworzy kopie danych z przyszlymi znacznikami czasu")),
                    section("Jak badac", "Daj graczom trzy warstwy: objaw, regule i cene manipulowania anomalia.")
            );
        };
    }

    private GeneratorOutputSection stats(String category, String tone, String system, String extraLabel, String extraValue) {
        return new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
                item("Kategoria", category),
                item("Klimat", displayTone(tone)),
                item("System", displaySystem(system)),
                item(extraLabel, extraValue)
        ));
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

    private String titleFor(String code) {
        return switch (code) {
            case "npc_horror" -> pick("Elena Ward", "Marek Voss", "Siostra Irena");
            case "clue" -> pick("List bez podpisu", "Zabrudzony medalion", "Fotografia z brakujaca osoba");
            case "cult_horror" -> pick("Bractwo Cichego Progu", "Krag Trzeciej Swiecy", "Dzieci Pustego Choru");
            case "horror_creature" -> pick("Ten, Ktory Puka", "Cien pod Schodami", "Glos z Mokrej Studni");
            case "survivor" -> pick("Kruk", "Mila", "Stary Borys");
            case "shelter" -> pick("Bastion 17", "Szkolna Piwnica", "Stacja Pod Wiaduktem");
            case "supply_run" -> pick("Market przy Obwodnicy", "Apteka Pod Neonem", "Magazyn Miejskich Sluzb");
            case "zombie_variant" -> pick("Cichy Biegacz", "Nosiciel Rdzy", "Zimny Tlum");
            case "npc_scifi" -> pick("Unit Sera-9", "Dr Vale Korr", "Nadia Quell");
            case "planet" -> pick("Kepler-Drift", "Nowa Latarnia", "Hespera IX");
            case "space_station" -> pick("Stacja Orfeusz", "Port Cerber", "Platforma L-13");
            default -> pick("Pekniecie Delta", "Echo spoza Mapy", "Anomalia Czarny Sygnet");
        };
    }

    private String labelFor(String code) {
        return switch (code) {
            case "npc_horror" -> "NPC horror";
            case "clue" -> "Trop";
            case "cult_horror" -> "Kult horror";
            case "horror_creature" -> "Istota horror";
            case "survivor" -> "Ocalaly";
            case "shelter" -> "Schronienie";
            case "supply_run" -> "Wyprawa po zasoby";
            case "zombie_variant" -> "Wariant zombie";
            case "npc_scifi" -> "NPC sci-fi";
            case "planet" -> "Planeta";
            case "space_station" -> "Stacja kosmiczna";
            default -> "Anomalia";
        };
    }

    private String category(String code) {
        if (HORROR.contains(code)) return "HORROR";
        if (POSTAPO.contains(code)) return "POSTAPO";
        return "SCIFI";
    }

    private String defaultTone(String category) {
        return switch (category) {
            case "HORROR" -> "investigation_horror";
            case "POSTAPO" -> "survival_drama";
            default -> "space_horror";
        };
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }

    private String displayTone(String tone) {
        return tone == null ? "" : tone.replace('_', ' ');
    }

    private String displaySystem(String system) {
        if (system == null || system.isBlank() || "system_agnostic".equals(system)) {
            return "Dowolny";
        }
        return system;
    }
}

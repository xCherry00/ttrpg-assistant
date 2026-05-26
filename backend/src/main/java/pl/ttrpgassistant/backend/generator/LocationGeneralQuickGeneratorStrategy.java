package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class LocationGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public LocationGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "location".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String setting = setting(params);
        String type = locationType(params, setting, pool);
        String purpose = locationPurpose(params);
        String name = nameFor(setting, type, pool);

        List<GeneratorOutputSection> sections = List.of(
                section("Opis", descriptionFor(setting, type, name, pool)),
                section("Wygląd", appearanceFor(setting, type, name, pool)),
                section("Klimat", atmosphereFor(setting, type, pool)),
                section("Funkcja sceny", purpose),
                section("Punkt zaczepienia", hookFor(setting, type)),
                section("Komplikacja", problemFor(setting, type)),
                section("Detal zmyslowy", sensoryDetail()),
                section("Haczyk", hookFor(setting, type))
        );

        return new GeneratorStructuredResultResponse(
                null,
                "location",
                "general.quick",
                name,
                type + " | " + setting,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("location", "any", "general.quick")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private String setting(Map<String, Object> params) {
        String requested = stringParam(params, "setting", "Losowy");
        return randomChoice(requested)
                ? pick(List.of("Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny"))
                : requested;
    }

    private String locationType(Map<String, Object> params, String setting, Map<String, Object> pool) {
        String requested = stringParam(params, "locationType", "Losowy");
        if (!randomChoice(requested)) {
            List<?> allowed = typesFor(setting, pool);
            if (containsOption(allowed, requested)) {
                return requested;
            }
        }
        return pick(typesFor(setting, pool));
    }

    private String locationPurpose(Map<String, Object> params) {
        String requested = stringParam(params, "locationPurpose", "Losowa");
        if (!randomChoice(requested)) {
            return requested;
        }
        return pick(List.of("Bezpieczne miejsce", "Miejsce sledztwa", "Miejsce walki", "Miejsce rozmowy", "Miejsce zasadzki", "Miejsce handlu", "Miejsce rytualu", "Miejsce finalu"));
    }

    private String sensoryDetail() {
        return pick(List.of(
                "Zapach mokrego drewna.",
                "Zimny przeciag od podlogi.",
                "Stlumione szepty za sciana.",
                "Slady blota prowadza donikad.",
                "Metaliczny posmak w powietrzu.",
                "Woda kapie z sufitu mimo suchej pogody.",
                "Slychac tykanie, choc nie ma zegara.",
                "Echo wraca z opoznieniem."
        ));
    }

    private List<?> typesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Statek kosmiczny", "Stacja kosmiczna", "Kolonia", "Planeta", "Laboratorium", "Port orbitalny", "Wrak", "Kopuła mieszkalna", "Kopalnia asteroid", "Moduł medyczny", "Czarny rynek", "Archiwum danych");
            case "postapo" -> List.of("Schronienie", "Ruiny miejskie", "Bunkier", "Farma", "Fabryka", "Posterunek", "Targ złomu", "Wieża radiowa", "Stacja benzynowa", "Szpital polowy", "Most", "Tunel metra");
            case "horror" -> List.of("Miejsce śledztwa", "Archiwum", "Szpital", "Świątynia", "Las", "Motel", "Stary dom", "Kostnica", "Szkoła", "Dworzec", "Sanatorium", "Posterunek policji");
            case "realistyczny" -> List.of("Mieszkanie", "Biuro", "Bar", "Magazyn", "Dworzec", "Hotel", "Parking", "Kawiarnia", "Szpital", "Komisariat", "Uczelnia", "Warsztat");
            default -> List.of("Tawerna", "Sklep", "Osada", "Dzielnica", "Świątynia", "Biblioteka", "Port", "Las", "Ruiny", "Zamek", "Wieża maga", "Cmentarz", "Most", "Kopalnia", "Młyn", "Sąd");
        };
    }

    private String nameFor(String setting, String type, Map<String, Object> pool) {
        String typeKey = looseKey(type);
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> sciFiName(typeKey);
            case "postapo" -> postapoName(typeKey);
            case "horror" -> horrorName(typeKey);
            case "realistyczny" -> realisticName(typeKey);
            default -> fantasyName(type, pool);
        };
    }

    private String fantasyName(String type, Map<String, Object> pool) {
        String typeKey = looseKey(type);
        if ("tawerna".equals(typeKey)) {
            return pick(List.of("Pod Czarnym Kogutem", "Trzy Świece", "Gospoda u Złamanej Włóczni", "Pod Głuchym Dzwonem", "Karczma przy Brodzie", "U Srebrnego Lisa"));
        }
        if ("sklep".equals(typeKey)) {
            return pick(List.of("Kram pod Srebrną Igłą", "Sklep Starego Miedziaka", "Dom Rzadkich Rzeczy", "Uczciwa Waga", "Szuflada Pani Miry", "Skład pod Arkadami"));
        }
        if ("osada".equals(typeKey)) {
            return pick(List.of("Brzeziny nad Traktem", "Kamienny Bród", "Zielona Strażnica", "Mokre Łąki", "Wilczy Jar", "Siedem Lip"));
        }
        if ("swiatynia".equals(typeKey)) return pick(List.of("Świątynia Trzeciego Dzwonu", "Kaplica Białych Popiołów", "Sanktuarium pod Lipą", "Dom Cichej Przysięgi"));
        if ("biblioteka".equals(typeKey)) return pick(List.of("Biblioteka pod Złotym Pyłem", "Archiwum Starej Wieży", "Czytelnia Miedzianych Tablic", "Skryptorium bez Okien"));
        if ("port".equals(typeKey)) return pick(List.of("Port Słonych Latarni", "Nabrzeże Trzech Ceł", "Przystań Krzywego Żurawia", "Stary Basen Kupiecki"));
        if ("las".equals(typeKey)) return pick(List.of("Las Cichych Dębów", "Bór Wilczych Znaków", "Zielony Mrok", "Gaj Złamanych Strzał"));
        if ("ruiny".equals(typeKey)) return pick(List.of("Ruiny Siedmiu Łuków", "Zawalony Dwór", "Stare Mury Darven", "Kamienne Gardło"));
        if ("zamek".equals(typeKey)) return pick(List.of("Zamek na Kruczej Skale", "Twierdza Białej Rdzy", "Strażnica nad Mgłą", "Czerwony Donżon"));
        if ("wieza maga".equals(typeKey)) return pick(List.of("Wieża Lustrzanego Pyłu", "Iglica Bez Cienia", "Dom Ostatniego Astrologa", "Wieża Trzech Zamków"));
        if ("cmentarz".equals(typeKey)) return pick(List.of("Cmentarz pod Mokrym Murem", "Pole Milczących Dzwonów", "Stare Groby za Kaplicą", "Nekropolia Srebrnych Imion"));
        if ("most".equals(typeKey)) return pick(List.of("Most Cichego Cła", "Kamienny Łuk nad Ruczajem", "Przeprawa Złamanej Chorągwi", "Most Siedmiu Przysiąg"));
        if ("kopalnia".equals(typeKey)) return pick(List.of("Kopalnia Czarnej Żyły", "Szyb pod Wilczym Wzgórzem", "Stare Chodniki Uldar", "Kopalnia Mokrego Srebra"));
        if ("mlyn".equals(typeKey)) return pick(List.of("Młyn nad Czarną Wodą", "Stary Młyn Brantów", "Koło pod Trzema Wierzbami", "Młyn bez Ziarna"));
        if ("sad".equals(typeKey)) return pick(List.of("Sąd pod Żelaznym Dębem", "Sala Starych Wyroków", "Dom Ławników", "Trybunał Czerwonej Pieczęci"));
        return pick(asList(pool.get("namePrefixes"))) + " " + pick(asList(pool.get("nameNouns")));
    }

    private String horrorName(String typeKey) {
        return switch (typeKey) {
            case "miejsce sledztwa" -> pick(List.of("Dom przy Czarnej Ulicy", "Piwnica Wardów", "Pokój 12", "Puste Mieszkanie nad Apteką"));
            case "archiwum" -> pick(List.of("Archiwum bez Sygnatury", "Czytelnia Zamkniętych Akt", "Magazyn Starych Spisów", "Rejestr pod Ratuszem"));
            case "szpital" -> pick(List.of("Szpital Świętej Marty", "Oddział Zachodni", "Klinika Różana", "Sala po Remoncie"));
            case "swiatynia" -> pick(List.of("Kaplica za Cmentarzem", "Kościół przy Suchym Dębie", "Zakrystia bez Okna", "Dom Parafialny św. Rocha"));
            case "las" -> pick(List.of("Las za Kaplicą", "Bór bez Ptaków", "Zagajnik Mokradeł", "Ścieżka pod Czarną Sosną"));
            case "motel" -> pick(List.of("Motel pod Sosnami", "Pokój 6", "Zajazd Ostatni Zjazd", "Recepcja przy Trasie 12"));
            case "stary dom" -> pick(List.of("Dom Różanych Tapet", "Willa bez Dzieci", "Stary Dom Hale'ów", "Kamienica przy Studni"));
            case "kostnica" -> pick(List.of("Kostnica Miejska", "Chłodnia pod Szpitalem", "Sala Sekcyjna B", "Zakład przy Cmentarzu"));
            case "szkola" -> pick(List.of("Szkoła nr 4", "Stara Sala Gimnastyczna", "Korytarz przy Bibliotece", "Internat św. Łucji"));
            case "dworzec" -> pick(List.of("Dworzec Końcowy", "Peron Trzeci", "Poczekalnia Nocna", "Stacja Pod Lasem"));
            case "sanatorium" -> pick(List.of("Sanatorium Różane", "Pawilon Ciszy", "Zakład na Wzgórzu", "Weranda Doktora Lenza"));
            default -> pick(List.of("Dom przy Czarnej Ulicy", "Archiwum bez Sygnatury", "Las za Kaplicą", "Motel pod Sosnami"));
        };
    }

    private String sciFiName(String typeKey) {
        return switch (typeKey) {
            case "statek kosmiczny" -> pick(List.of("ISV Corveaux", "Srebrny Nomad", "Kurier P-17", "Niezarejestrowany Pół-Zero"));
            case "stacja kosmiczna" -> pick(List.of("Stacja Orfeusz", "Port Kallisto", "Platforma L-13", "Węzeł Cerber"));
            case "kolonia" -> pick(List.of("Kolonia Hespera IX", "Nowy Ostrów", "Lima-7", "Osiedle Pod Kopułą"));
            case "planeta" -> pick(List.of("Hespera IX", "Vega Dolna", "Proxima Drift", "Kepler-Brzeg"));
            case "laboratorium" -> pick(List.of("Laboratorium Helix", "Moduł C-13", "Ośrodek Prób Aster", "Sekcja Biała"));
            case "port orbitalny" -> pick(List.of("Port Kallisto", "Dok Siedem", "Orbitalny Próg", "Terminal Vesta"));
            case "wrak" -> pick(List.of("Wrak Kalipso", "Kadłub po Ikarze", "Czarny Moduł", "Cichy Transportowiec"));
            case "kopula mieszkalna" -> pick(List.of("Kopuła Vesta", "Sektor Mieszkalny Trzy", "Domy pod Szkłem", "Osiedle przy Generatorze"));
            case "kopalnia asteroid" -> pick(List.of("Kopalnia Nyx", "Szyb Ceres-8", "Pas Zeta", "Platforma Górnicza Młot"));
            case "modul medyczny" -> pick(List.of("Moduł Medyczny Lira", "Izolatorium C", "Pokład Sanitarny 4", "Klinika Orbitalna"));
            case "czarny rynek" -> pick(List.of("Targ pod Dokiem", "Kanał Szary", "Bazarek Nieważkich", "Sektor bez Kamer"));
            case "archiwum danych" -> pick(List.of("Archiwum Helix", "Serwerownia Siódma", "Magazyn Kopii", "Węzeł Pamięci"));
            default -> pick(List.of("Port Kallisto", "ISV Corveaux", "Hespera IX", "Stacja Orfeusz"));
        };
    }

    private String postapoName(String typeKey) {
        return switch (typeKey) {
            case "schronienie" -> pick(List.of("Bastion 17", "Szkolna Piwnica", "Schron pod Kinem", "Sala z Podwójnymi Drzwiami"));
            case "ruiny miejskie" -> pick(List.of("Sortownia przy Rzece", "Bloki bez Okien", "Rynek bez Dachu", "Pętla Tramwajowa"));
            case "bunkier" -> pick(List.of("Bunkier K-9", "Żelazna Komora", "Schron Dowództwa", "Drzwi Numer 4"));
            case "farma" -> pick(List.of("Farma za Wiaduktem", "Pole Trzech Studni", "Szklarnia Ruty", "Gospodarstwo przy Maszcie"));
            case "fabryka" -> pick(List.of("Fabryka Czerwonego Pyłu", "Hala Tłoczni", "Zakład Bez Zmian", "Stare Taśmy"));
            case "posterunek" -> pick(List.of("Posterunek Most", "Budka przy Trasie", "Wieża Północna", "Brama Sektora B"));
            case "targ zlomu" -> pick(List.of("Targ Rdzy", "Plac Starych Części", "Rynek Filtrów", "Aleja Blach"));
            case "wieza radiowa" -> pick(List.of("Wieża Głuchych", "Maszt Trzeciego Sygnału", "Radio Suchy Dach", "Antena Północ"));
            case "stacja benzynowa" -> pick(List.of("Stacja Ostatni Bak", "Dystrybutor 6", "Zajazd pod Pompą", "Suchy Kanister"));
            case "szpital polowy" -> pick(List.of("Szpital z Plandeki", "Namiot Doktor Miry", "Punkt Opatrunkowy", "Sala po Autobusie"));
            case "most" -> pick(List.of("Most Północny", "Przeprawa z Blach", "Zerwany Wiadukt", "Most za Haracz"));
            case "tunel metra" -> pick(List.of("Tunel Siedem", "Peron bez Światła", "Stacja Podziemna B", "Torowisko Ciche"));
            default -> pick(List.of("Bastion 17", "Szkolna Piwnica", "Sortownia przy Rzece", "Stary Wodociąg"));
        };
    }

    private String realisticName(String typeKey) {
        return switch (typeKey) {
            case "mieszkanie" -> pick(List.of("Mieszkanie 17B", "Kawalerka nad Sklepem", "Lokal przy Cichej", "Trzecie Piętro bez Windy"));
            case "biuro" -> pick(List.of("Biuro na Trzecim", "Open Space przy Rondzie", "Gabinet Kierownika", "Pokój Kadr"));
            case "bar" -> pick(List.of("Bar Pod Neonem", "Nocna Zmiana", "U Romka", "Mały Stolik"));
            case "magazyn" -> pick(List.of("Magazyn C-12", "Hala za Torami", "Skład przy Rampie", "Kontener 44"));
            case "dworzec" -> pick(List.of("Dworzec Północny", "Peron Siódmy", "Poczekalnia Nocna", "Przejście Podziemne"));
            case "hotel" -> pick(List.of("Hotel Rondo", "Pokój 214", "Recepcja pod Zegarem", "Apartament Techniczny"));
            case "parking" -> pick(List.of("Parking pod Galerią", "Poziom -2", "Plac za Marketem", "Garaż przy Bloku"));
            case "kawiarnia" -> pick(List.of("Kawiarnia Mokra", "Stolik przy Oknie", "Mała Czarna", "Cukiernia Dworcowa"));
            case "szpital" -> pick(List.of("Szpital Miejski", "Izba Przyjęć", "Oddział Nocny", "Korytarz Diagnostyki"));
            case "komisariat" -> pick(List.of("Komisariat Wschód", "Pokój Przesłuchań 2", "Dyżurka", "Archiwum Spraw"));
            case "uczelnia" -> pick(List.of("Uczelnia przy Parku", "Sala 208", "Dziekanat", "Stare Laboratorium"));
            case "warsztat" -> pick(List.of("Warsztat Kani", "Kanał Numer Dwa", "Auto-Serwis Brama", "Lakiernia za Płotem"));
            default -> pick(List.of("Bar Pod Neonem", "Magazyn C-12", "Dworzec Północny", "Biuro na Trzecim"));
        };
    }

    private String descriptionFor(String setting, String type, String name, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> name + " to " + lower(type) + " działające na granicy procedur, awarii i interesów załogi.";
            case "postapo" -> name + " to " + lower(type) + ", które wygląda bezpiecznie tylko z daleka.";
            case "horror" -> name + " to " + lower(type) + ", gdzie jeden szczegół nie pasuje do oficjalnej wersji wydarzeń.";
            case "realistyczny" -> name + " to " + lower(type) + " z codziennym ruchem, słabym punktem i czyimś sekretem.";
            default -> type + ": " + pick(asList(pool.get("exteriors"))) + ".";
        };
    }

    private String appearanceFor(String setting, String type, String name, Map<String, Object> pool) {
        String typeKey = looseKey(type);
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of(
                    "Na pierwszy plan wychodzą panele serwisowe, zimne światło i oznaczenia, które ktoś nadpisywał wiele razy",
                    "Czyste powierzchnie są przełamane prowizorycznymi naprawami, kablami i śladami po pośpiechu",
                    "Miejsce wygląda technicznie i użytkowo, ale jeden sektor jest wyraźnie bardziej pilnowany niż reszta",
                    "Przez szkło, metal i ostrzegawcze pasy przebija zużycie, którego nie widać w oficjalnych raportach"
            )) + ".";
            case "postapo" -> pick(List.of(
                    "Z zewnątrz widać łaty z blachy, barykady i ślady wielu napraw robionych bez planu",
                    "Najważniejsze przejścia są oznaczone farbą, sznurkiem albo przedmiotami zostawionymi jako ostrzeżenie",
                    "Miejsce jest brudne, praktyczne i zbyt ciche; każdy element wygląda, jakby miał drugie zastosowanie",
                    "Widać stare zniszczenia, świeże ślady bytowania i jeden punkt, którego wszyscy wyraźnie unikają"
            )) + ".";
            case "horror" -> pick(List.of(
                    "Najpierw wygląda zwyczajnie, dopiero po chwili widać, że proporcje, ślady albo światło nie zgadzają się ze sobą",
                    "Kurz i wilgoć układają się tak, jakby ktoś niedawno przesuwał rzeczy, których nie powinno tu być",
                    "Jeden detal przyciąga wzrok za każdym razem: plama, rysa, zasłonięte drzwi albo przedmiot odłożony zbyt równo",
                    "Miejsce ma twarz normalności, ale kąty, lustra i przejścia psują to wrażenie"
            )) + ".";
            case "realistyczny" -> pick(List.of(
                    "Widać codzienne zużycie, przypadkowe drobiazgi i drobną niekonsekwencję, która zdradza ukryty problem",
                    "Układ jest praktyczny, ale ktoś przestawił kilka rzeczy tak, żeby utrudnić patrzenie w jedno miejsce",
                    "Meble, światło i ślady ludzi tworzą zwykły obraz, dopóki nie zauważy się świeżo zamkniętego przejścia",
                    "To miejsce wygląda jak setki podobnych, z wyjątkiem jednego punktu pilnowanego wzrokiem przez obecnych"
            )) + ".";
            default -> fantasyAppearance(typeKey, name, pool);
        };
    }

    private String fantasyAppearance(String typeKey, String name, Map<String, Object> pool) {
        if ("tawerna".equals(typeKey)) {
            return pick(List.of("Niski strop, dym z paleniska i stoły porysowane nożami sprawiają, że " + name + " wygląda na miejsce pełne starych rozmów", "Nad kontuarem wiszą pamiątki po gościach, a najciemniejszy kąt jest zbyt wygodny, by był przypadkowy")) + ".";
        }
        if ("sklep".equals(typeKey)) {
            return pick(List.of("Półki stoją gęsto, towary opisano nierównym pismem, a pod ladą widać zamkniętą szufladę z lepszym zamkiem", "Wystawa jest skromna, lecz zapach ziół, metalu i starego papieru obiecuje rzeczy spoza oficjalnego cennika")) + ".";
        }
        if ("swiatynia".equals(typeKey)) {
            return pick(List.of("Kamień jest wypolerowany kolanami wiernych, ale najświętszy symbol ma świeżą rysę", "Świece palą się równo, choć przeciąg porusza chorągwiami przy wejściu")) + ".";
        }
        if ("biblioteka".equals(typeKey)) {
            return pick(List.of("Regały tworzą wąskie przejścia, a część ksiąg spięto łańcuchami nowszymi niż same zamki", "Kurz leży grubo poza jednym stołem, przy którym ktoś pracował tej nocy")) + ".";
        }
        if ("port".equals(typeKey)) {
            return pick(List.of("Mokre deski, liny i latarnie tworzą gęsty chaos, w którym łatwo zgubić ślad albo człowieka", "Sól zjadła farbę z szyldów, lecz jeden magazyn wygląda podejrzanie świeżo")) + ".";
        }
        if ("las".equals(typeKey)) {
            return pick(List.of("Drzewa rosną zbyt równo, a ścieżka znika tam, gdzie powinna być najbardziej uczęszczana", "Korzenie, mech i cisza układają się jak naturalna brama do czegoś starszego")) + ".";
        }
        if ("ruiny".equals(typeKey) || "zamek".equals(typeKey) || "kopalnia".equals(typeKey)) {
            return pick(List.of("Spękane mury, ciemne otwory i świeże ślady na kamieniu mówią, że to miejsce nie jest tak martwe, jak wygląda", "Stara konstrukcja trzyma się uporem, a najnowsze ślady prowadzą dokładnie tam, gdzie powinno być najniebezpieczniej")) + ".";
        }
        return pick(asList(pool.get("exteriors"))) + " W środku albo przy wejściu widać jeden detal, który od razu sugeruje obecny konflikt.";
    }

    private String atmosphereFor(String setting, String type, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of("Szum wentylacji, chłodne światło i komunikaty, które powtarzają się za często", "Sterylna powierzchnia kryje prowizoryczne naprawy", "Każdy system działa, ale nikt mu w pełni nie ufa", "Powietrze pachnie ozonem, smarem i zbyt długą zmianą", "Cisza między alertami jest gorsza od samych alertów")) + ".";
            case "postapo" -> pick(List.of("Cisza jest praktyczna, nie spokojna", "Wszystko pachnie kurzem, paliwem i filtrowaną wodą", "Ludzie mówią szeptem, bo głos kosztuje bezpieczeństwo", "Każdy cień może być osłoną albo zasadzką", "Widać ślady wielu napraw i żadnej gwarancji")) + ".";
            case "horror" -> pick(List.of("Powietrze jest za ciężkie, a dźwięki dochodzą z niewłaściwych miejsc", "Światło nie dociera do kątów, które powinno oświetlać", "Zwykłe przedmioty wyglądają jak dowody", "Coś w zapachu sugeruje wilgoć, leki albo stary dym", "Miejsce wydaje się puste, ale nie samotne")) + ".";
            case "realistyczny" -> pick(List.of("Codzienny chaos maskuje jedną rzecz, której nikt nie chce widzieć", "Miejsce żyje rutyną i drobnymi napięciami", "Wszystko wygląda normalnie, dopóki ktoś nie zacznie pytać", "Ludzie patrzą krótko, ale zapamiętują za dużo", "Zwykłe odgłosy tworzą wygodną zasłonę dla problemu")) + ".";
            default -> pick(asList(pool.get("atmospheres"))) + ".";
        };
    }

    private String problemFor(String setting, String type) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of("Jeden system raportuje fałszywe dane", "Załoga ukrywa konflikt przed pasażerami", "Dostęp do kluczowego modułu został zablokowany", "Ktoś podmienił harmonogram dokowania", "Czujniki widzą ruch tam, gdzie nie ma ludzi"));
            case "postapo" -> pick(List.of("Kończy się zasób, na którym oparto bezpieczeństwo", "Ktoś zna boczne wejście", "Wewnątrz narasta spór o zasady", "Nowi przybysze przynieśli chorobę albo plotkę", "Znikają narzędzia potrzebne do napraw"));
            case "horror" -> pick(List.of("Trop prowadzi do osoby, która oficjalnie nie ma związku ze sprawą", "Miejsce było już przeszukane, ale coś się zmieniło", "Ktoś usuwa dowody szybciej niż gracze je znajdują", "Świadek odmawia wejścia do środka", "W każdym raporcie brakuje tej samej godziny"));
            default -> pick(List.of("Lokalna frakcja chce przejąć kontrolę", "Ktoś znika po zmroku", "Właściciel albo strażnik prosi o dyskretną pomoc", "Nowy podatek wywołał cichy bunt", "Ważny gość zniknął bez śladu"));
        };
    }

    private String secretFor(String setting, String type) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of("Najważniejszy zapis został usunięty przez kogoś z uprawnieniami", "AI zna odpowiedź, ale nie może jej podać wprost", "Cargo albo dane są opisane fałszywą etykietą", "Jedna śluza prowadzi do sekcji spoza planów", "Ktoś nadaje stąd sygnał bez rejestracji"));
            case "postapo" -> pick(List.of("To miejsce ocalało, bo kogoś kiedyś zostawiono na zewnątrz", "Pod podłogą ukryto zapas, o który ludzie mogliby się zabić", "Mapa okolicy celowo pomija jedną drogę", "Lider zna datę następnego ataku", "Najbezpieczniejszy pokój ma drugie, ukryte wejście"));
            case "horror" -> pick(List.of("Pierwszy świadek nigdy nie opuścił tego miejsca", "Ściany albo dokumenty pamiętają inną wersję zdarzeń", "Prawdziwy trop jest ukryty jako rzecz banalna", "Ktoś regularnie wraca tu po północy", "Jedno nazwisko pojawia się w zbyt wielu miejscach"));
            default -> pick(List.of("Pod codziennym handlem kryje się stara umowa", "Najstarsza część miejsca ma innego właściciela", "Ktoś płaci za milczenie miejscowych", "Piwnica jest większa niż budynek", "Lokalny autorytet nie powinien znać tego miejsca"));
        };
    }

    private String hookFor(String setting, String type) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> "Drużyna dostaje dostęp, ale tylko jeśli rozwiąże problem zanim system automatycznie go ukryje.";
            case "postapo" -> "Miejsce może dać zasób albo schronienie, lecz wejście w jego sprawy zmieni lokalny układ sił.";
            case "horror" -> "Trop jest prosty do znalezienia, ale jego znaczenie robi się jasne dopiero po złej decyzji.";
            default -> "Wprowadź miejsce jako szybką scenę: jeden detal, jedna osoba, jeden problem i decyzja dla drużyny.";
        };
    }

    private boolean randomChoice(String value) {
        String normalized = normalize(value);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random") || normalized.isBlank();
    }

    private boolean containsOption(List<?> values, String requested) {
        String normalized = normalize(requested);
        return values.stream().map(String::valueOf).map(this::normalize).anyMatch(normalized::equals);
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return GeneratorTextSanitizer.clean(picked);
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String looseKey(String value) {
        String normalized = java.text.Normalizer.normalize(value == null ? "" : value.replace('Ł', 'L').replace('ł', 'l'), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }

    private String lower(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }
}

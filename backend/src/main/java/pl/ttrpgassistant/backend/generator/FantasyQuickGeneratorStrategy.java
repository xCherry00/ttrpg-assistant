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
public class FantasyQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String VARIANT = "fantasy.quick";
    private static final Set<String> SUPPORTED = Set.of(
            "tavern",
            "shop_fantasy",
            "settlement_fantasy",
            "district_fantasy",
            "dungeon_concept",
            "dungeon_room",
            "monster_variant",
            "magic_item",
            "quest_fantasy"
    );

    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return SUPPORTED.contains(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        return generate("tavern", VARIANT, request);
    }

    @Override
    public GeneratorStructuredResultResponse generate(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        if (!SUPPORTED.contains(generatorCode)) {
            generatorCode = "tavern";
        }

        String tone = stringParam(params, "tone", "dark_fantasy");
        String system = stringParam(params, "system", "system_agnostic");
        Spec spec = spec(generatorCode);
        String title = titleFor(generatorCode, params);

        return new GeneratorStructuredResultResponse(
                null,
                generatorCode,
                VARIANT,
                title,
                spec.subtitle + " - Fantasy - " + displayTone(tone),
                sectionsFor(generatorCode, params, tone, system, title),
                "seed",
                OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> sectionsFor(String generatorCode, Map<String, Object> params, String tone, String system, String title) {
        return switch (generatorCode) {
            case "shop_fantasy" -> List.of(
                    stats(tone, system, "Typ", stringParam(params, "shopType", "Losowy")),
                    section("Wlasciciel", "Sklep prowadzi " + owner(params) + ". W rozmowie szybko sprawdza, czy klienci rozumieja wartosc informacji."),
                    section("Wyglad", title + " jest ciasny, dobrze zabezpieczony i pachnie kurzem, woskiem oraz metalem. Za lada wisza drobne talizmany przeciw zlodziejom."),
                    section("Dostepne towary", shopStock(params) + rareItem(params)),
                    section("Problem wlasciciela", pick("ktos podmienia towar po zamknieciu", "staly klient placi falszywymi monetami", "rzadka przesylka utknela poza miastem", "lokalna frakcja chce przejac najlepsze kontrakty")),
                    section("Jak uzyc na sesji", "Daj graczom wybor: kupic potrzebny sprzet od razu, pomoc wlascicielowi albo wykorzystac jego problem jako wejscie do kolejnego watku.")
            );
            case "settlement_fantasy" -> List.of(
                    stats(tone, system, "Rozmiar", stringParam(params, "size", "Osada")),
                    section("Opis", title + " stoi na granicy bezpiecznych drog i dziczy. Ludzie sa goscinni, ale szybko milkna przy obcych pytaniach."),
                    section("Wazne miejsce", pick("stary mlyn nad czarna rzeka", "kaplica z peknietym dzwonem", "posterunek z widokiem na trakt")),
                    section("Dominujaca sila", settlementFaction(params) + " ma najwiekszy wplyw na decyzje mieszkancow, ale nie wszyscy uznaja jej autorytet."),
                    section("Glowny problem", settlementProblem(params)),
                    section("Sekret osady", pick("pod fundamentami lezy starsza nekropolia", "lokalny bohater byl zdrajca", "studnia laczy sie z ukrytym tunelem", "mieszkancy regularnie placa komus spoza map")),
                    section("Mozliwy quest", "Druzyna moze odslonic zrodlo problemu, zanim osada sama wskaze winnego. Najlepiej zaczac od sceny publicznej: zebrania, targu albo pogrzebu.")
            );
            case "district_fantasy" -> List.of(
                    stats(tone, system, "Typ dzielnicy", stringParam(params, "districtType", "Losowy")),
                    section("Wyglad", title + " ma status: " + stringParam(params, "wealthLevel", "Mieszana") + ". Waske ulice, wiszace szyldy i swiatla za brudnymi oknami tworza miejsce pelne spojrzen zza zaslon."),
                    section("Dominujaca grupa", pick("cech przewoznikow", "rodzina przemytnikow", "zakon ubogich uzdrowicieli")),
                    section("Poziom zagrozenia", "Zagrozenie: " + stringParam(params, "dangerLevel", "Sredni") + ". Patrol albo lokalna banda pojawia sie wtedy, gdy gracze za dlugo stoja w miejscu."),
                    section("Lokalny problem", pick("rosnie haracz", "ktos falszuje dokumenty wladz", "nocami pojawia sie zakapturzony kaznodzieja", "ginie towar z zamknietych magazynow")),
                    section("Sekret dzielnicy", "Pod codziennym handlem kryje sie stara umowa z frakcja spoza miasta."),
                    section("Scena startowa", "Rozpocznij od zamieszania na ulicy: zatrzymania, pozaru, krzyku z okna albo publicznej licytacji skradzionego przedmiotu.")
            );
            case "dungeon_concept" -> List.of(
                    stats(tone, system, "Typ lochu", stringParam(params, "dungeonType", "Ruiny")),
                    section("Historia miejsca", title + " zbudowano dla celu, o ktorym wspolczesni mieszkancy wola nie pamietac."),
                    section("Obecny stan", dungeonState(params)),
                    section("Glowne zagrozenie", dungeonThreat(params)),
                    section("Wazne pomieszczenia", pick("sala przysiag, zalany korytarz i zamkniete sanktuarium", "zawalone koszary, glowny szyb i kaplica bez posagu", "archiwum, komora straznicza i ukryta krypta")),
                    section("Skarb albo sekret", "Najcenniejsza nagroda jest zwiazana z powodem upadku tego miejsca, wiec jej zdobycie powinno zmienic wiedze graczy o lokacji.")
            );
            case "dungeon_room" -> List.of(
                    stats(tone, system, "Cel pomieszczenia", stringParam(params, "roomPurpose", "Losowy")),
                    section("Opis wejscia", "Drzwi nosza slady narzedzi, a prog jest starty przez wiele stop."),
                    section("Opis pomieszczenia", title + " jest zimniejsza niz korytarz. Jeden szczegol nie pasuje do reszty wystroju i sugeruje niedawna obecnosc kogos zywego."),
                    section("Zawartosc", pick("polamany oltarz", "skrzynia z mokrym drewnem", "mapa wydrapana w tynku")),
                    section("Zagrozenie", "Poziom: " + stringParam(params, "dangerLevel", "Sredni") + ". " + pick("Cichy mechanizm czeka pod posadzka.", "Ukryty obserwator reaguje na swiatlo.", "Trujacy pyl unosi sie przy gwaltownym ruchu.")),
                    section("Skarb", booleanParam(params, "containsTreasure", true) ? "W pomieszczeniu jest nagroda, ale lezy przy czyms, czego nie da sie zabrac bez decyzji." : "Nie ma tu skarbu, ale jest wskazowka prowadzaca do lepszego miejsca."),
                    section("Wyjscia", pick("jedno widoczne wyjscie i jedno ukryte przejscie za peknieta sciana", "schody w dol oraz waski szyb wentylacyjny", "zamkniete drzwi z symbolem pasujacym do innej komnaty"))
            );
            case "monster_variant" -> List.of(
                    stats(tone, system, "Bazowe stworzenie", stringParam(params, "baseCreatureType", "Losowe")),
                    section("Wyglad", title + " laczy motyw: " + stringParam(params, "mutationTheme", "Losowy") + " ze srodowiskiem: " + stringParam(params, "environment", "Losowe") + ". Znana sylwetka stworzenia jest znieksztalcona przez dawna magie."),
                    section("Zachowanie", pick("broni konkretnego miejsca", "poluje tylko podczas mgly", "unika ognia i glosnych dzwiekow")),
                    section("Specjalna cecha", "Poziom zagrozenia: " + stringParam(params, "threatLevel", "Sredni") + ". " + pick("Jego rany zarastaja kora.", "Jego krzyk wywoluje wizje.", "Zostawia za soba swiecacy slad.", "Na chwile kopiuje glos ostatniej ofiary.")),
                    section("Slabosc", "Slabosc nie musi byc mechaniczna: moze byc rytual, wspomnienie albo element terenu."),
                    section("Pomysl na scene", "Najpierw pokaz slady i konsekwencje, dopiero potem samo stworzenie. Wtedy wariant bedzie czytelny, a nie tylko nazwany.")
            );
            case "magic_item" -> List.of(
                    stats(tone, system, "Typ przedmiotu", stringParam(params, "itemType", "Losowy")),
                    section("Wyglad", title + " pochodzi z miejsca: " + stringParam(params, "origin", "Losowe") + ". Wyglada cennie, ale nosi slady uzywania przez kogos zdesperowanego."),
                    section("Efekt fabularny", "Moc: " + stringParam(params, "powerLevel", "Uzyteczny") + ". " + pick("Otwiera droge tam, gdzie nie ma drzwi.", "Pokazuje prawde tylko za cene wspomnienia.", "Wzmacnia wlasciciela, gdy dziala wbrew sobie.", "Pozwala zadac jedno pytanie miejscu, w ktorym sie znajduje.")),
                    section("Wada albo klatwa", booleanParam(params, "isCursed", true) ? pick("Przyciaga dawnych wlascicieli.", "Nie pozwala klamac w waznej chwili.", "Domaga sie zwrotu przyslugi.", "Oznacza wlasciciela snem, ktory widza inni.") : "Nie jest przeklety, ale jego uzycie zostawia rozpoznawalny slad."),
                    section("Poprzedni wlasciciel", "Poprzedni wlasciciel nie zniknal przypadkiem."),
                    section("Hak fabularny", "Ktos rozpozna przedmiot w najmniej wygodnym momencie i potraktuje go jako dowod, dlug albo obietnice.")
            );
            case "quest_fantasy" -> List.of(
                    stats(tone, system, "Skala", stringParam(params, "scale", "Lokalna")),
                    section("Zleceniodawca", patron(params) + " prosi o pomoc, ale nie mowi calej prawdy w pierwszej rozmowie."),
                    section("Problem", questProblem(params)),
                    section("Cel", "Typ zadania: " + stringParam(params, "questType", "Losowy") + ". Cel powinien byc jasny dla graczy po pierwszej scenie."),
                    section("Komplikacja", pick("zleceniodawca zna winnego", "nagroda jest cudza wlasnoscia", "cel misji nie chce zostac uratowany")),
                    section("Nagroda", "Nagroda: " + stringParam(params, "rewardType", "Losowa") + ". Powinna otwierac kolejna decyzje, nie tylko zamykac zadanie.")
            );
            default -> List.of(
                    stats(tone, system, "Standard", stringParam(params, "standard", "Zwykla")),
                    section("Nazwa", title),
                    section("Wyglad z zewnatrz", "Niski budynek z cieplym swiatlem w oknach i szyldem, ktory widzial lepsze lata. Atmosfera: " + stringParam(params, "atmosphere", "Losowa") + "."),
                    section("Wnetrze", "W srodku mieszaja sie rozmowy, zapach dymu, goracego jedzenia i mokrych plaszczy. Jeden stol milknie zawsze, gdy ktos wchodzi."),
                    section("Wlasciciel", pick("Mira Voss, spokojna karczmarka z pamiecia do twarzy", "Bren Uld, byly najemnik o dobrym sercu", "Elian Rook, uprzejmy gospodarz z niebezpiecznym dlugiem")),
                    section("Plotka", pick("ktos wynajal pokoj i nigdy go nie opuscil", "pod piwnica znaleziono starszy fundament", "jedna z beczek przyszla z zakazanej dzielnicy")),
                    section("Problem", tavernProblem(params)),
                    section("Jak uzyc na sesji", "Najlepiej wprowadzic tawerne jako miejsce odpoczynku, ktore po jednej rozmowie zaczyna wygladac jak poczatek przygody.")
            );
        };
    }

    private GeneratorOutputSection stats(String tone, String system, String extraLabel, String extraValue) {
        return new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
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

    private String titleFor(String generatorCode, Map<String, Object> params) {
        return switch (generatorCode) {
            case "shop_fantasy" -> pick("Kram Pod Srebrna Igla", "Sklep Starego Miedziaka", "Dom Rzadkich Rzeczy");
            case "settlement_fantasy" -> pick("Brzeziny nad Traktem", "Kamienny Brod", "Zielona Straznica");
            case "district_fantasy" -> pick("Dzielnica Krzywych Latarni", "Stare Nabrzeze", "Cichy Rynek");
            case "dungeon_concept" -> pick("Krypta Bez Dzwieku", "Kopalnia Pod Zlamanym Szczytem", "Swiatynia Zapomnianej Przysiegi");
            case "dungeon_room" -> pick("Sala Popiolowych Znakow", "Komnata Peknietej Studni", "Zbrojownia Bez Cieni");
            case "monster_variant" -> pick("Mglowy Wilkor", "Kosciany Troll z Bagien", "Ghul Korzeni");
            case "magic_item" -> pick("Klucz Ostatniego Progu", "Pierscien Cudzego Glosu", "Latarnia Bez Plomienia");
            case "quest_fantasy" -> pick("Dlug spod Czarnego Mostu", "Zaginiony Herold", "Cena Spokojnej Nocy");
            default -> pick("Pod Czarnym Kogutem", "Trzy Swiece", "Gospoda U Zlamanej Wloczni");
        };
    }

    private Spec spec(String generatorCode) {
        return switch (generatorCode) {
            case "shop_fantasy" -> new Spec("Sklep fantasy");
            case "settlement_fantasy" -> new Spec("Osada fantasy");
            case "district_fantasy" -> new Spec("Dzielnica fantasy");
            case "dungeon_concept" -> new Spec("Koncept lochu");
            case "dungeon_room" -> new Spec("Pomieszczenie lochu");
            case "monster_variant" -> new Spec("Wariant potwora");
            case "magic_item" -> new Spec("Magiczny przedmiot");
            case "quest_fantasy" -> new Spec("Quest fantasy");
            default -> new Spec("Tawerna fantasy");
        };
    }

    private String owner(Map<String, Object> params) {
        String ownerType = stringParam(params, "ownerType", "Losowy");
        if (!randomChoice(ownerType)) {
            return ownerType.toLowerCase() + " z lista stalych dluznikow";
        }
        return pick("cierpliwy krasnoludzki rzemieslnik", "uprzejma elfia kolekcjonerka dlugow", "zmeczony mag z zakletym notatnikiem", "byly awanturnik, ktory boi sie jednego nazwiska");
    }

    private String shopStock(Map<String, Object> params) {
        String shopType = stringParam(params, "shopType", "Losowy");
        if (!randomChoice(shopType)) {
            return "Glowny asortyment pasuje do typu sklepu: " + shopType + ". Na polkach leza rzeczy praktyczne, ale kazda ma swoja mala historie.";
        }
        return pick(
                "Podstawowy ekwipunek, kilka lokalnych osobliwosci i narzedzia dobrej jakosci.",
                "Tanie towary sa na widoku, ale prawdziwy handel odbywa sie po podaniu odpowiedniego hasla.",
                "Sklep ma mniej towaru niz powinien, za to kazdy przedmiot jest opisany drobnym pismem."
        );
    }

    private String rareItem(Map<String, Object> params) {
        if (!booleanParam(params, "hasRareItem", true)) {
            return " Wlasciciel nie ma rzadkiego przedmiotu, ale wie, kto ostatnio taki sprzedal.";
        }
        return " Rzadki przedmiot: " + pick("srebrny kompas wskazujacy nie polnoc, tylko dlug", "fiolka z deszczem z miejsca, gdzie nigdy nie pada", "niewielki noz, ktory nie rzuca cienia") + ".";
    }

    private String settlementFaction(Map<String, Object> params) {
        String faction = stringParam(params, "dominantFaction", "Losowa");
        return randomChoice(faction) ? pick("rada osady", "lokalna swiatynia", "milicja", "cech przewoznikow", "rod szlachecki") : faction;
    }

    private String settlementProblem(Map<String, Object> params) {
        String problem = stringParam(params, "mainProblem", "Losowy");
        if (!randomChoice(problem)) {
            return "Wybrany problem: " + problem + ". Mieszkancy znaja objawy, ale boja sie nazwac winnego.";
        }
        return pick("znikaja zapasy na zime", "dzieci slysza glosy spod studni", "lokalna rodzina szlachecka probuje przejac ziemie", "choroba dotyka tylko ludzi, ktorzy byli przy starym trakcie");
    }

    private String dungeonState(Map<String, Object> params) {
        String state = stringParam(params, "currentState", "Losowy");
        if (!randomChoice(state)) {
            return "Obecny stan: " + state + ". Ten stan zmienia sposob poruszania sie po lokacji i powinien byc widoczny od wejscia.";
        }
        return pick("czesciowo zalane i niestabilne", "opanowane przez nowa bande", "przebudzone po ostatnim trzesieniu ziemi", "pozornie opuszczone, ale regularnie sprzatane");
    }

    private String dungeonThreat(Map<String, Object> params) {
        String threat = stringParam(params, "mainThreat", "Losowe");
        if (!randomChoice(threat)) {
            return "Glowne zagrozenie: " + threat + ". Niech zostawi trzy rozpoznawalne slady zanim gracze je spotkaja.";
        }
        return pick("rytual, ktory nadal dziala", "wladca ruin bez ciala", "kolonia stworzen uczacych sie ludzkich zachowan", "magiczna awaria reagujaca na klamstwo");
    }

    private String patron(Map<String, Object> params) {
        String patronType = stringParam(params, "patronType", "Losowy");
        if (!randomChoice(patronType)) {
            return patronType;
        }
        return pick("straznik, ktory nie ufa swoim przelozonym", "kupiec zbyt spokojny jak na ofiare", "kaplanka ukrywajaca czesc prawdy", "uchodzca rozpoznajacy symbol na mapie");
    }

    private String questProblem(Map<String, Object> params) {
        String questType = stringParam(params, "questType", "Losowy");
        if (!randomChoice(questType)) {
            return "Zadanie typu " + questType + " zaczyna sie prosto, ale szybko ujawnia druga strone konfliktu.";
        }
        return pick("zaginela osoba zwiazana z frakcja", "droga handlowa stala sie pulapka", "stary dlug wrocil w nowej formie", "ktos chce odzyskac cos, czego nigdy nie powinien posiadac");
    }

    private String tavernProblem(Map<String, Object> params) {
        String problem = stringParam(params, "problem", "Losowy");
        if (!randomChoice(problem)) {
            return "Wybrany problem: " + problem + ". Wlasciciel zna wiecej szczegolow, ale poda je dopiero po okazaniu zaufania.";
        }
        return pick("gosc zniknal przed switem", "lokalna banda zada ochrony", "w kuchni slychac glosy zza sciany", "staly bywalec zostawil list adresowany do jednej z postaci");
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean booleanParam(Map<String, Object> params, String key, boolean fallback) {
        Object value = params.get(key);
        if (value == null) {
            return fallback;
        }
        if (value instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random") || normalized.isBlank();
    }

    private String displayTone(String tone) {
        return tone == null ? "Fantasy" : tone.replace('_', ' ');
    }

    private String displaySystem(String system) {
        if (system == null || system.isBlank() || "system_agnostic".equals(system)) {
            return "Dowolny";
        }
        return system;
    }

    private record Spec(String subtitle) {
    }
}

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
            "quest_fantasy",
            "npc_fantasy",
            "encounter_fantasy",
            "trap_fantasy",
            "loot_fantasy",
            "faction_fantasy"
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
                "loot_fantasy".equals(generatorCode) ? spec.subtitle + " - Fantasy" : spec.subtitle + " - Fantasy - " + displayTone(tone),
                sectionsFor(generatorCode, params, tone, system, title),
                "seed",
                OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> sectionsFor(String generatorCode, Map<String, Object> params, String tone, String system, String title) {
        return switch (generatorCode) {
            case "shop_fantasy" -> List.of(
                    stats(tone, system, "Typ", stringParam(params, "shopType", "Losowy")),
                    section("Właściciel", "Sklep prowadzi " + owner(params) + ". W rozmowie szybko sprawdza, czy klienci rozumieja wartosc informacji."),
                    section("Wygląd", title + " jest ciasny, dobrze zabezpieczony i pachnie kurzem, woskiem oraz metalem. Za lada wiszą drobne talizmany przeciw złodziejom."),
                    section("Dostepne towary", shopStock(params) + rareItem(params)),
                    section("Problem właściciela", pick("ktoś podmienia towar po zamknieciu", "stały klient placi falszywymi monetami", "rzadka przesylka utknela poza miastem", "lokalna frakcja chce przejac najlepsze kontrakty")),
                    section("Jak użyć na sesji", "Daj graczom wybór: kupić potrzebny sprzęt od razu, pomoc właścicielowi albo wykorzystać jego problem jako wejście do kolejnego wątku.")
            );
            case "settlement_fantasy" -> List.of(
                    stats(tone, system, "Rozmiar", stringParam(params, "size", "Osada")),
                    section("Opis", title + " stoi na granicy bezpiecznych drog i dziczy. Ludzie sa gośćinni, ale szybko milkna przy obcych pytaniach."),
                    section("Wazne miejsce", pick("stary mlyn nad czarna rzeka", "kaplica z peknietym dzwonem", "posterunek z widokiem na trakt")),
                    section("Dominująca sila", settlementFaction(params) + " ma największy wpływ na decyzje mieszkańców, ale nie wszyscy uznają jej autorytet."),
                    section("Główny problem", settlementProblem(params)),
                    section("Sekret osady", pick("pod fundamentami leży starsza nekropolia", "lokalny bohater byl zdrajca", "studnia laczy sie z ukrytym tunelem", "mieszkancy regularnie placa komus spoza map")),
                    section("Możliwy quest", "Drużyna może odslonic źródło problemu, zanim osada sama wskaze winnego. Najlepiej zacząć od sceny publicznej: zebrania, targu albo pogrzebu.")
            );
            case "district_fantasy" -> List.of(
                    stats(tone, system, "Typ dzielnicy", stringParam(params, "districtType", "Losowy")),
                    section("Wygląd", title + " ma status: " + stringParam(params, "wealthLevel", "Mieszana") + ". Waske ulice, wiszące szyldy i światla za brudnymi oknami tworza miejsce pełne spojrzen zza zaslon."),
                    section("Dominująca grupa", pick("cech przewoznikow", "rodzina przemytnikow", "zakon ubogich uzdrowicieli")),
                    section("Poziom zagrożenia", "Zagrożenie: " + stringParam(params, "dangerLevel", "Średni") + ". Patrol albo lokalna banda pojawia sie wtedy, gdy gracze za długo stoja w miejscu."),
                    section("Lokalny problem", pick("rosnie haracz", "ktoś falszuje dokumenty wladz", "nocami pojawia sie zakapturzony kaznodzieja", "ginie towar z zamknietych magazynow")),
                    section("Sekret dzielnicy", "Pod codziennym handlem kryje sie stara umowa z frakcja spoza miasta."),
                    section("Scena startowa", "Rozpocznij od zamieszania na ulicy: zatrzymania, pozaru, krzyku z okna albo publicznej licytacji skradzionego przedmiotu.")
            );
            case "dungeon_concept" -> List.of(
                    stats(tone, system, "Typ lochu", stringParam(params, "dungeonType", "Ruiny")),
                    section("Historia miejsca", title + " zbudowano dla celu, o którym wspolczesni mieszkancy wola nie pamietac."),
                    section("Obecny stan", dungeonState(params)),
                    section("Główne zagrożenie", dungeonThreat(params)),
                    section("Wazne pomieszczenia", pick("sala przysiag, zalany korytarz i zamkniete sanktuarium", "zawalone koszary, główny szyb i kaplica bez posagu", "archiwum, komora straznicza i ukryta krypta")),
                    section("Skarb albo sekret", "Najcenniejsza nagroda jest zwiazana z powodem upadku tego miejsca, wiec jej zdobycie powinno zmieńic wiedze graczy o lokacji.")
            );
            case "dungeon_room" -> List.of(
                    stats(tone, system, "Cel pomieszczenia", stringParam(params, "roomPurpose", "Losowy")),
                    section("Opis wejscia", "Drzwi nosza ślady narzedzi, a prog jest starty przez wiele stop."),
                    section("Opis pomieszczenia", title + " jest zimniejsza niż korytarz. Jeden szczegol nie pasuje do reszty wystroju i sugeruje niedawna obecnosc kogos żywego."),
                    section("Zawartosc", pick("polamany oltarz", "skrzynia z mokrym drewnem", "mapa wydrapana w tynku")),
                    section("Zagrożenie", "Poziom: " + stringParam(params, "dangerLevel", "Średni") + ". " + pick("Cichy mechaniżm czeka pod posadzka.", "Ukryty obserwator reaguje na światło.", "Trujacy pył unosi sie przy gwaltownym ruchu.")),
                    section("Skarb", booleanParam(params, "containsTreasure", true) ? "W pomieszczeniu jest nagroda, ale leży przy czyms, czego nie da sie zabrac bez decyzji." : "Nie ma tu skarbu, ale jest wskazowka prowadzaca do lepszego miejsca."),
                    section("Wyjscia", pick("jedno widoczne wyjscie i jedno ukryte przejście za peknieta sciana", "schody w dol oraz waski szyb wentylacyjny", "zamkniete drzwi z symbolem pasujacym do innej komnaty"))
            );
            case "monster_variant" -> List.of(
                    stats(tone, system, "Bazowe stworzenie", stringParam(params, "baseCreatureType", "Losowe")),
                    section("Wygląd", title + " laczy motyw: " + stringParam(params, "mutationTheme", "Losowy") + " ze srodowiskiem: " + stringParam(params, "environment", "Losowe") + ". Znana sylwetka stworzenia jest znieksztalcona przez dawna magie."),
                    section("Zachowanie", pick("broni konkretnego miejsca", "poluje tylko podczas mgly", "unika ognia i głosnych dzwiekow")),
                    section("Specjalna cecha", "Poziom zagrożenia: " + stringParam(params, "threatLevel", "Średni") + ". " + pick("Jego rany zarastaja kora.", "Jego krzyk wywoluje wizje.", "Zostawia za soba swiecacy ślad.", "Na chwile kopiuje głos ostatniej ofiary.")),
                    section("Słabość", "Słabość nie musi byc mechaniczna: może byc rytual, wspomnienie albo element terenu."),
                    section("Pomysl na scene", "Najpierw pokaz ślady i konsekwencje, dopiero potem samo stworzenie. Wtedy wariant bedzie czytelny, a nie tylko nazwany.")
            );
            case "magic_item" -> List.of(
                    stats(tone, system, "Typ przedmiotu", stringParam(params, "itemType", "Losowy")),
                    section("Wygląd", title + " pochodzi z miejsca: " + stringParam(params, "origin", "Losowe") + ". Wygląda cennie, ale nosi ślady używania przez kogos zdesperowanego."),
                    section("Efekt fabularny", "Moc: " + stringParam(params, "powerLevel", "Uzyteczny") + ". " + pick("Otwiera drogę tam, gdzie nie ma drzwi.", "Pokazuje prawde tylko za cene wspomnienia.", "Wzmacnia właściciela, gdy działa wbrew sobie.", "Pozwala żądac jedno pytanie miejscu, w którym sie znajduje.")),
                    section("Wada albo klątwa", booleanParam(params, "isCursed", true) ? pick("Prżyciaga dawnych właścicieli.", "Nie pozwala kłamać w ważnej chwili.", "Domaga sie zwrotu przysługi.", "Oznacza właściciela snem, który widza inni.") : "Nie jest przeklety, ale jego użycie zostawia rozpoznawalny ślad."),
                    section("Poprzedni właściciel", "Poprzedni właściciel nie zniknął przypadkiem."),
                    section("Hak fabularny", "Ktos rozpozna przedmiot w najmniej wygodnym momencie i potraktuje go jako dowod, dług albo obietnice.")
            );
            case "quest_fantasy" -> List.of(
                    stats(tone, system, "Skala", stringParam(params, "scale", "Lokalna")),
                    section("Zleceniodawca", patron(params) + " prosi o pomoc, ale nie mowi calej prawdy w pierwszej rozmowie."),
                    section("Problem", questProblem(params)),
                    section("Cel", "Typ żądania: " + stringParam(params, "questType", "Losowy") + ". Cel powinien byc jasny dla graczy po pierwszej scenie."),
                    section("Komplikacja", pick("zleceniodawca zna winnego", "nagroda jest cudza wlasnoscia", "cel misji nie chce zostac uratowany")),
                    section("Nagroda", "Nagroda: " + stringParam(params, "rewardType", "Losowa") + ". Powinna otwierac kolejna decyzje, nie tylko zamykac żądanie.")
            );
            case "npc_fantasy" -> List.of(
                    stats(tone, system, "Rasa", stringParam(params, "race", "Losowa")),
                    section("Imię i profesja", title + " - " + stringParam(params, "profession", "Losowa") + ". Osoba, która ma powod byc tam, gdzie sa gracze."),
                    section("Wygląd", pick("Wysoki, ciemne oczy, blizna na prawym policzku i zbyt drogie buty jak na zawod.", "Drobna, szybkie ruchy, zawsze patrzy na wyjscie.", "Starszy, spokojny głos, ręce zdradzaja zawod lepiej niż slowa.")),
                    section("Osobowość", pick("Uprzejmy, ale mowi tylko tyle ile musi.", "Bezpośredni do granicy impertynencji.", "Cierpliwy obserwator, który zapamietuje wszystko.")),
                    section("Motywacja", pick("Chroni kogos, kogo nie wymienia z imięnia.", "Szuka czegoś, co stracil dawno temu.", "Splacono go za milczenie - ale nie wiedzial o co chodzi.")),
                    section("Sekret", pick("Zna odpowiedz na pytanie, którego gracze jeszcze nie żądali.", "Byl obecny przy zdarzeniu, o którym wszyscy milcza.", "Ma powod, zeby gracze nie doszli do celu - niekoniecznie zly.")),
                    section("Hak dla drużyny", "NPC może stac sie sojusznikiem, informatorem albo komplikacja. Nie pokazuj od razu, po której stronie stoi.")
            );
            case "encounter_fantasy" -> List.of(
                    stats(tone, system, "Typ spotkania", stringParam(params, "encounterType", "Losowy")),
                    section("Opis sytuacji", "Drużyna wpada na " + title + ". Sytuacja wygląda prosto, dopoki ktoś nie żąda drugiego pytania."),
                    section("Uczestnicy", pick("Grupa najemnikow z rozkazami, o których nie mowia.", "Lokalna milicja z podejrzanie konkretnym pytaniem.", "Kurier, który rozpoznaje jeden z symboli na ekwipunku drużyny.")),
                    section("Cel spotkania", pick("Eskortowac, przeszkodzic albo zaobserwowac - do wybóru w zaleznosci od decyzji graczy.", "Zbadac, wynegocjowac albo uciec - każda opcja prowadzi gdzie indziej.", "Pomoc, zdemaskowac albo zignorowac - ignorowanie ma konsekwencje.")),
                    section("Możliwa walka", "Walka jest możliwa, ale nie konieczna. Jesli do niej dojdzie, jedna strona ma cel ważniejszy niż zwyciestwo."),
                    section("Nagroda albo konsekwencja", pick("Informacja, która zmienia plan.", "Kontakt, który wróci później z wlasnym pytaniem.", "Przedmiot, który ktoś inny bedzie chcial odzyskac."))
            );
            case "trap_fantasy" -> List.of(
                    stats(tone, system, "Typ pułapki", stringParam(params, "trapType", "Losowa")),
                    section("Opis", title + " jest dobrze ukryta. Ktos polozyl ja z mysla o konkretnym typie intruza."),
                    section("Jak ja zauważyć", pick("Zbyt gladka posadzka przy jednej scianie.", "Ślad kurzu, który omija pewien fragment podlogi.", "Specyficzny zapach oleju albo rdzy bez widocznego źródła.")),
                    section("Co ja aktywuje", pick("Nacisk ciezarem powyzej polowy czlowieka.", "Światlo magiczne lub latarnia w promieniu 3 stop.", "Wyslowienie konkretnej frazy w pobliskim pomieszczeniu.")),
                    section("Efekt", "Poziom śmiertelności: " + stringParam(params, "lethality", "Średni") + ". " + pick("Siec z metalowych drutow opada z sufitu.", "Strzaly z bocznych szczelin.", "Podloga opada, ujawniajac glebokie zejscie.")),
                    section("Jak ja obejsc", pick("Mechaniżm resetowania jest po drugiej stronie.", "Waga na plycie można zastapic odpowiednim przedmiotem.", "Istnieje ominiecie dla tych, ktorzy znaja znak budowniczych."))
            );
            case "loot_fantasy" -> cleanLootSections(params);
            case "faction_fantasy" -> List.of(
                    stats(tone, system, "Typ frakcji", stringParam(params, "factionType", "Losowa")),
                    section("Nazwa i cel", title + " działa na widoku albo z cienia - w obu przypadkach cel jest ten sam: kontrola nad konkretnym zasobem lub tajemnica."),
                    section("Lider", pick("Osoba publiczna, której autorytetu nikt nie kwestionuje otwarcie.", "Ktos, kto formalnie nie istnieje w żadnym rejestrze.", "Komitet - żadna decyzja nie ma jednego autora.")),
                    section("Symbol i metody", "Typ: " + stringParam(params, "factionType", "Losowa") + ". " + pick("Dziala przez pośrednikow i nigdy nie pozostawia bezpośrednich śladów.", "Uzywa legalnych kanalow do nielegalnych celow.", "Oferuje pomoc najpierw, rachunek później.")),
                    section("Zasoby", pick("Siec informatorow w kazdym większym mieście.", "Dostep do dokumentow, które oficjalnie nie istnieja.", "Pieniadze i ludzie gotowi działać bez pytan.")),
                    section("Konflikt i słabość", "Frakcja ma wewnętrzna sprzecznosc, która gracze mogą wykorzystać, jesli ja znajda. Jej cel i metody nie sa tak spójne jak wygląda z zewnątrz.")
            );
            default -> List.of(
                    stats(tone, system, "Standard", stringParam(params, "standard", "Zwykla")),
                    section("Nazwa", title),
                    section("Wygląd z zewnątrz", "Niski budynek z cieplym światłem w oknach i szyldem, który widzial lepsze lata. Atmosfera: " + stringParam(params, "atmosphere", "Losowa") + "."),
                    section("Wnetrze", "W srodku mieszaja sie rozmowy, zapach dymu, goracego jedzenia i mokrych płaszczy. Jeden stol milknie zawsze, gdy ktoś wchodzi."),
                    section("Właściciel", pick("Mira Voss, spokojna karczmarka z pamiecia do twarzy", "Bren Uld, byly najemnik o dobrym sercu", "Elian Rook, uprzejmy gospodarz z niebezpiecznym długiem")),
                    section("Plotka", pick("ktoś wynajal pokoj i nigdy go nie opuscil", "pod piwnica znaleziono starszy fundament", "jedna z beczek przyszla z zakazanej dzielnicy")),
                    section("Problem", tavernProblem(params)),
                    section("Jak użyć na sesji", "Najlepiej wprowadzic tawerne jako miejsce odpoczynku, które po jednej rozmowie zaczyna wyglądac jak poczatek przygody.")
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
        return new GeneratorOutputSection(
                "text",
                GeneratorTextSanitizer.clean(title),
                GeneratorTextSanitizer.clean(content),
                List.of()
        );
    }

    private List<GeneratorOutputSection> cleanLootSections(Map<String, Object> params) {
        String lootType = stringParam(params, "lootType", "Losowy");
        String rarity = stringParam(params, "rarity", "Losowa");
        String displayedType = randomChoice(lootType) ? pick("Sakwa", "Skrzynka", "Kieszenie przeciwnika", "Depozyt", "Relikwiarz") : lootType;
        String displayedRarity = randomChoice(rarity) ? pick("Banalny", "Uzyteczny", "Cenny", "Dziwny", "Przeklety", "Fabularny") : rarity;

        if (isPickpocketLoot(displayedType)) {
            return List.of(
                    section("Typ", "Kradziez kieszonkowa"),
                    section("Rzadkosc / wartosc", displayedRarity),
                    section("Monety", purseCoins()),
                    section("Przedmioty", pick(
                            "kosciana kostka do gry, dwa guziki z liberii i zlozony rachunek z gospody",
                            "mały grzebien, kawalek kredy, tani pierscien i zwinieta woskowana kartęczka",
                            "naparstek, pekniety medalion, trzy paciorki modlitewne i suszony listek miety",
                            "zeton z domu gry, igla w korku, kawalek czerwonej nici i bardzo mały kluczyk"
                    )),
                    section("Haczyk / komplikacja", pick(
                            "Właściciel rozpozna drobiazg szybciej, niż gracze zdaza go sprzedac.",
                            "W srodku jest znak lokalnej frakcji.",
                            "Jeden przedmiot jest dowodem w cudzej sprawie."
                    ))
            );
        }

        return List.of(
                section("Typ", displayedType),
                section("Rzadkosc / wartosc", displayedRarity),
                section("Monety", pick(
                        "kilka monet roznych mennic",
                        "niewielka sakiewka srebra",
                        "drobne kosztownosci latwe do ukryćia",
                        "garsc starych miedziakow i jedna obca zlota moneta"
                )),
                section("Główny przedmiot", pick(
                        "pierscien z herbem rodu, który oficjalnie nie istnieje",
                        "mapa z jednym nieopisanym szlakiem",
                        "klucz bez pasujacego zamka w poblizu",
                        "mały relikwiarz pachnacy ozonem",
                        "ksiega rachunkowa z wyrwanymi stronami"
                )),
                section("Dziwny detal", pick(
                        "jedna moneta jest ciepla",
                        "opakowanie pachnie kadzidlem",
                        "na metalu widać swieze zadrapania",
                        "na materiale wyszyto znak lokalnej frakcji"
                )),
                section("Znaczenie fabularne", pick(
                        "Ktos rozpozna ten lup i bedzie chcial wiedziec, skad gracze go maja.",
                        "Najcenniejszy przedmiot jest dowodem w cudzej sprawie.",
                        "Prawdziwa wartosc kryje sie w znaku, nie w materiale."
                ))
        );
    }

    private String purseCoins() {
        return pick(
                roll(2, 8) + " cp, " + roll(1, 6) + " sp",
                roll(1, 12) + " cp, " + roll(2, 4) + " sp, " + roll(1, 2) + " gp",
                roll(3, 6) + " cp i " + roll(1, 4) + " falsżywe srebrniki",
                roll(1, 6) + " sp, " + roll(1, 4) + " gp i jedna moneta z obcej mennicy",
                roll(4, 10) + " cp w kilku drobnych woreczkach"
        );
    }

    private boolean isPickpocketLoot(String lootType) {
        String normalized = normalize(lootType)
                .replace("ż", "z")
                .replace("ó", "o")
                .replace("ą", "a")
                .replace("ę", "e")
                .replace("ł", "l")
                .replace("ś", "s")
                .replace("ć", "c")
                .replace("ń", "n")
                .replace("ź", "z");
        return normalized.contains("kradziez kieszonkowa") || normalized.contains("pickpocket") || normalized.contains("purse");
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
            case "dungeon_concept" -> pick("Krypta Bez Dzwieku", "Kopalnia Pod Zlamanym Szczytem", "Światynia Zapomnianej Przysiegi");
            case "dungeon_room" -> pick("Sala Popiolowych Znakow", "Komnata Peknietej Studni", "Zbrojownia Bez Cieni");
            case "monster_variant" -> pick("Mglowy Wilkor", "Kościany Troll z Bagien", "Ghul Korzeni");
            case "magic_item" -> pick("Klucz Ostatniego Progu", "Pierscien Cudzego Glosu", "Latarnia Bez Plomienia");
            case "quest_fantasy" -> pick("Dług spod Czarnego Mostu", "Zaginiony Herold", "Cena Spokojnej Nocy");
            case "npc_fantasy" -> pick("Eryn z Polnocnych Drog", "Bram Kossfeld", "Sibylle bez Nazwiska");
            case "encounter_fantasy" -> pick("Patrol z Nieoczekiwanym Rozkazem", "Uzbrojony Kurierski Konwoj", "Poszukiwacze bez Zleceniodawcy");
            case "trap_fantasy" -> pick("Pulapka Budowniczego Krypt", "Mechaniżm Starej Wiey", "Magiczna Przeszkoda Bez Nazwy");
            case "loot_fantasy" -> pick("Sakwa Nieplanowanej Ucieczki", "Skrzynka zastawiona jako dług", "Lup bez mapy powrótnej", "Depozyt pod zlamana pieczecia", "Paczka z cudzym herbem", "Reszta po zaginionym poborcy");
            case "faction_fantasy" -> pick("Bractwo Otwartej Dloni", "Krag Bez Herbu", "Kompania Trzech Nazwisk");
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
            case "npc_fantasy" -> new Spec("NPC fantasy");
            case "encounter_fantasy" -> new Spec("Spotkanie fantasy");
            case "trap_fantasy" -> new Spec("Pulapka fantasy");
            case "loot_fantasy" -> new Spec("Lup");
            case "faction_fantasy" -> new Spec("Frakcja fantasy");
            default -> new Spec("Tawerna fantasy");
        };
    }

    private String owner(Map<String, Object> params) {
        String ownerType = stringParam(params, "ownerType", "Losowy");
        if (!randomChoice(ownerType)) {
            return ownerType.toLowerCase() + " z lista stałych dluznikow";
        }
        return pick("cierpliwy krasnoludzki rzemieślnik", "uprzejma elfia kolekcjonerka długów", "zmęczony mag z zaklętym notatnikiem", "były awanturnik, który boi się jednego nazwiska");
    }

    private String shopStock(Map<String, Object> params) {
        String shopType = stringParam(params, "shopType", "Losowy");
        if (!randomChoice(shopType)) {
            return "Główny asortyment pasuje do typu sklepu: " + shopType + ". Na półkach leżą rzeczy praktyczne, ale każda ma swoją mała historie.";
        }
        return pick(
                "Podstawowy ekwipunek, kilka lokalnych osobliwosci i narzedzia dobrej jakośći.",
                "Tanie towary są na widoku, ale prawdziwy handel odbywa się po podaniu odpowiedniego hasła.",
                "Sklep ma mniej towaru niż powinien, za to kazdy przedmiot jest opisany drobnym pismem."
        );
    }

    private String rareItem(Map<String, Object> params) {
        if (!booleanParam(params, "hasRareItem", true)) {
            return " Właściciel nie ma rzadkiego przedmiotu, ale wie, kto ostatnio taki sprzedal.";
        }
        return " Rzadki przedmiot: " + pick("srebrny kompas wskazujacy nie polnoc, tylko dług", "fiolka z deszczem z miejsca, gdzie nigdy nie pada", "niewielki noz, który nie rzuca cienia") + ".";
    }

    private String settlementFaction(Map<String, Object> params) {
        String faction = stringParam(params, "dominantFaction", "Losowa");
        return randomChoice(faction) ? pick("rada osady", "lokalna świątynia", "milicja", "cech przewoznikow", "rod szlachecki") : faction;
    }

    private String settlementProblem(Map<String, Object> params) {
        String problem = stringParam(params, "mainProblem", "Losowy");
        if (!randomChoice(problem)) {
            return "Wybrany problem: " + problem + ". Mieszkancy znaja objawy, ale boja sie nazwac winnego.";
        }
        return pick("znikaja zapasy na zime", "dzieci slysza głosy spod studni", "lokalna rodzina szlachecka probuje przejac ziemie", "choroba dotyka tylko ludzi, ktorzy byli przy starym trakcie");
    }

    private String dungeonState(Map<String, Object> params) {
        String state = stringParam(params, "currentState", "Losowy");
        if (!randomChoice(state)) {
            return "Obecny stan: " + state + ". Ten stan zmienia sposób poruszania sie po lokacji i powinien byc widoczny od wejscia.";
        }
        return pick("częściowo zalane i niestabilne", "opanowane przez nowa bande", "przebudzone po ostatnim trzesieniu ziemi", "pozornie opuszczone, ale regularnie sprzatane");
    }

    private String dungeonThreat(Map<String, Object> params) {
        String threat = stringParam(params, "mainThreat", "Losowe");
        if (!randomChoice(threat)) {
            return "Główne zagrożenie: " + threat + ". Niech zostawi trzy rozpoznawalne ślady zanim gracze je spotkaja.";
        }
        return pick("rytual, który nadal działa", "władca ruin bez ciala", "kolonia stworzen uczacych sie ludzkich zachowan", "magiczna awaria reagujaca na kłamstwo");
    }

    private String patron(Map<String, Object> params) {
        String patronType = stringParam(params, "patronType", "Losowy");
        if (!randomChoice(patronType)) {
            return patronType;
        }
        return pick("strażnik, który nie ufa swoim przełożonym", "kupiec zbyt spokojny jak na ofiarę", "kapłanka ukrywająca część prawdy", "uchodźca rozpoznający symbol na mapie");
    }

    private String questProblem(Map<String, Object> params) {
        String questType = stringParam(params, "questType", "Losowy");
        if (!randomChoice(questType)) {
            return "Zadanie typu " + questType + " zaczyna sie prosto, ale szybko ujawnia druga strone konfliktu.";
        }
        return pick("zaginela osoba zwiazana z frakcja", "droga handlowa stala sie pułapka", "stary dług wrócil w nowej formie", "ktoś chce odzyskac cos, czego nigdy nie powinien posiadac");
    }

    private String tavernProblem(Map<String, Object> params) {
        String problem = stringParam(params, "problem", "Losowy");
        if (!randomChoice(problem)) {
            return "Wybrany problem: " + problem + ". Właściciel zna więcej szczegółów, ale poda je dopiero po okazaniu zaufania.";
        }
        return pick("gość zniknął przed świtem", "lokalna banda żąda ochrony", "w kuchni słychać głosy zza ściany", "stały bywalec zostawił list adresowany do jednej z postaci");
    }

    private String pick(String... values) {
        return GeneratorTextSanitizer.clean(values[random.nextInt(values.length)]);
    }

    private int roll(int count, int sides) {
        int total = 0;
        for (int i = 0; i < count; i++) {
            total += 1 + random.nextInt(sides);
        }
        return total;
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return GeneratorTextSanitizer.clean(value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value));
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

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
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



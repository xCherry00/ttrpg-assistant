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
            case "npc_fantasy" -> List.of(
                    stats(tone, system, "Rasa", stringParam(params, "race", "Losowa")),
                    section("Imie i profesja", title + " Ă˘â‚¬â€ť " + stringParam(params, "profession", "Losowa") + ". Osoba, ktora ma powod byc tam, gdzie sa gracze."),
                    section("Wyglad", pick("Wysoki, ciemne oczy, blizna na prawym policzku i zbyt drogie buty jak na zawod.", "Drobna, szybkie ruchy, zawsze patrzy na wyjscie.", "Starszy, spokojny glos, rece zdradzaja zawod lepiej niz slowa.")),
                    section("Osobowosc", pick("Uprzejmy, ale mowi tylko tyle ile musi.", "Bezposredni do granicy impertynencji.", "Cierpliwy obserwator, ktory zapamietuje wszystko.")),
                    section("Motywacja", pick("Chroni kogos, kogo nie wymienia z imienia.", "Szuka czegoÄąâ€ş, co straci dawno temu.", "Splacono go za milczenie Ă˘â‚¬â€ť ale nie wiedzial o co chodzi.")),
                    section("Sekret", pick("Zna odpowiedz na pytanie, ktorego gracze jeszcze nie zadali.", "Byl obecny przy zdarzeniu, o ktorym wszyscy milcza.", "Ma powod, zeby gracze nie doszli do celu Ă˘â‚¬â€ť niekoniecznie zly.")),
                    section("Hak dla druzyny", "NPC moze stac sie sojusznikiem, informatorem albo komplikacja. Nie pokazuj od razu, po ktorej stronie stoi.")
            );
            case "encounter_fantasy" -> List.of(
                    stats(tone, system, "Typ spotkania", stringParam(params, "encounterType", "Losowy")),
                    section("Opis sytuacji", "Druzyna wpada na " + title + ". Sytuacja wyglada prosto, dopoki ktos nie zada drugiego pytania."),
                    section("Uczestnicy", pick("Grupa najemnikow z rozkazami, o ktorych nie mowia.", "Lokalna milicja z podejrzanie konkretnym pytaniem.", "Kurier, ktory rozpoznaje jeden z symboli na ekwipunku druzyny.")),
                    section("Cel spotkania", pick("Eskortowac, przeszkodzic albo zaobserwowac Ă˘â‚¬â€ť do wyboru w zaleznosci od decyzji graczy.", "Zbadac, wynegocjowac albo uciec Ă˘â‚¬â€ť kazda opcja prowadzi gdzie indziej.", "Pomoc, zdemaskowac albo zignorowac Ă˘â‚¬â€ť ignorowanie ma konsekwencje.")),
                    section("Mozliwa walka", "Walka jest mozliwa, ale nie konieczna. Jesli do niej dojdzie, jedna strona ma cel wazniejszy niz zwyciestwo."),
                    section("Nagroda albo konsekwencja", pick("Informacja, ktora zmienia plan.", "Kontakt, ktory wrÄ‚Ĺ‚ci pozniej z wlasnym pytaniem.", "Przedmiot, ktory ktos inny bedzie chcial odzyskac."))
            );
            case "trap_fantasy" -> List.of(
                    stats(tone, system, "Typ pulapki", stringParam(params, "trapType", "Losowa")),
                    section("Opis", title + " jest dobrze ukryta. Ktos polozyl ja z mysla o konkretnym typie intruza."),
                    section("Jak ja zauwazyc", pick("Zbyt gladka posadzka przy jednej scianie.", "Slad kurzu, ktory omija pewien fragment podlogi.", "Specyficzny zapach oleju albo rdzy bez widocznego zrodla.")),
                    section("Co ja aktywuje", pick("Nacisk ciezarem powyzej polowy czlowieka.", "Swiatlo magiczne lub latarnia w promieniu 3 stop.", "Wyslowienie konkretnej frazy w pobliskim pomieszczeniu.")),
                    section("Efekt", "Poziom smiertelnosci: " + stringParam(params, "lethality", "Sredni") + ". " + pick("Siec z metalowych drutow opada z sufitu.", "Strzaly z bocznych szczelin.", "Podloga opada, ujawniajac glebokie zejscie.")),
                    section("Jak ja obejsc", pick("Mechanizm resetowania jest po drugiej stronie.", "Waga na plycie mozna zastapic odpowiednim przedmiotem.", "Istnieje ominiecie dla tych, ktorzy znaja znak budowniczych."))
            );
            case "loot_fantasy" -> cleanLootSections(params);
            case "faction_fantasy" -> List.of(
                    stats(tone, system, "Typ frakcji", stringParam(params, "factionType", "Losowa")),
                    section("Nazwa i cel", title + " dziala na widoku albo z cienia Ă˘â‚¬â€ť w obu przypadkach cel jest ten sam: kontrola nad konkretnym zasobem lub tajemnica."),
                    section("Lider", pick("Osoba publiczna, ktorej autorytetu nikt nie kwestionuje otwarcie.", "Ktos, kto formalnie nie istnieje w zadnym rejestrze.", "Komitet Ă˘â‚¬â€ť zadna decyzja nie ma jednego autora.")),
                    section("Symbol i metody", "Typ: " + stringParam(params, "factionType", "Losowa") + ". " + pick("Dziala przez posrednikow i nigdy nie pozostawia bezposrednich sladow.", "Uzywa legalnych kanalow do nielegalnych celow.", "Oferuje pomoc najpierw, rachunek pozniej.")),
                    section("Zasoby", pick("Siec informatorow w kazdym wiekszym miescie.", "Dostep do dokumentow, ktore oficjalnie nie istnieja.", "Pieniadze i ludzie gotowi dzialac bez pytan.")),
                    section("Konflikt i slabosc", "Frakcja ma wewnetrzna sprzecznosc, ktora gracze moga wykorzystac, jesli ja znajda. Jej cel i metody nie sa tak spojne jak wyglada z zewnatrz.")
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
                            "maly grzebien, kawalek kredy, tani pierscien i zwiniÄ™ta woskowana karteczka",
                            "naparstek, pekniety medalion, trzy paciorki modlitewne i suszony listek miety",
                            "zeton z domu gry, igla w korku, kawalek czerwonej nici i bardzo maly kluczyk"
                    )),
                    section("Haczyk / komplikacja", pick(
                            "Wlasciciel rozpozna drobiazg szybciej, niz gracze zdaza go sprzedac.",
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
                        "drobne kosztownosci latwe do ukrycia",
                        "garsc starych miedziakow i jedna obca zlota moneta"
                )),
                section("Glowny przedmiot", pick(
                        "pierscien z herbem rodu, ktory oficjalnie nie istnieje",
                        "mapa z jednym nieopisanym szlakiem",
                        "klucz bez pasujacego zamka w poblizu",
                        "maly relikwiarz pachnacy ozonem",
                        "ksiega rachunkowa z wyrwanymi stronami"
                )),
                section("Dziwny detal", pick(
                        "jedna moneta jest ciepla",
                        "opakowanie pachnie kadzidlem",
                        "na metalu widac swieze zadrapania",
                        "na materiale wyszyto znak lokalnej frakcji"
                )),
                section("Znaczenie fabularne", pick(
                        "Ktos rozpozna ten lup i bedzie chcial wiedziec, skad gracze go maja.",
                        "Najcenniejszy przedmiot jest dowodem w cudzej sprawie.",
                        "Prawdziwa wartosc kryje sie w znaku, nie w materiale."
                ))
        );
    }

    private List<GeneratorOutputSection> lootSections(Map<String, Object> params) {
        String lootType = stringParam(params, "lootType", "Losowy");
        String rarity = stringParam(params, "rarity", "Losowa");
        if (isPickpocketLoot(lootType)) {
            return List.of(
                    section("Typ", "KradzieÄąÄ˝ kieszonkowa"),
                    section("Rzadkosc / wartosc", randomChoice(rarity) ? pick("Banalny", "Uzyteczny", "Cenny", "Dziwny", "Przeklety", "Fabularny") : rarity),
                    section("Monety", purseCoins()),
                    section("Przedmioty", pick(
                            "koÄąâ€şciana kostka do gry, dwa guziki z liberiĂ„â€¦ i zÄąâ€šoÄąÄ˝ony rachunek z gospody",
                            "maÄąâ€šy grzebieÄąâ€ž, kawaÄąâ€šek kredy, tani pierÄąâ€şcieÄąâ€ž i zwiniĂ„â„˘ta woskowana karteczka",
                            "naparstek, pĂ„â„˘kniĂ„â„˘ty medalion, trzy paciorki modlitewne i suszony listek miĂ„â„˘ty",
                            "ÄąÄ˝eton z domu gry, igÄąâ€ša w korku, kawaÄąâ€šek czerwonej nici i bardzo maÄąâ€šy kluczyk",
                            "czarna wstĂ„â€¦ÄąÄ˝ka, poÄąâ€šamany sygnet, okruch bursztynu i kartka z jednĂ„â€¦ godzinĂ„â€¦"
                    ))
            );
        }
        return List.of(
                section("Typ", lootType),
                section("Rzadkosc / wartosc", randomChoice(rarity) ? pick("Banalny", "Uzyteczny", "Cenny", "Dziwny", "Przeklety", "Fabularny") : rarity),
                section("Monety", pick("kilka monet rÄ‚Ĺ‚ÄąÄ˝nych mennic", "niewielka sakiewka srebra", "drobne kosztownoÄąâ€şci Äąâ€šatwe do ukrycia", "garÄąâ€şĂ„â€ˇ starych miedziakÄ‚Ĺ‚w i jedna obca zÄąâ€šota moneta", "srebrne krĂ„â€¦ÄąÄ˝ki bez wybitego herbu", "opÄąâ€šata podrÄ‚Ĺ‚ÄąÄ˝na w zapieczĂ„â„˘towanej kopercie")),
                section("GÄąâ€šÄ‚Ĺ‚wny przedmiot", pick("pierÄąâ€şcieÄąâ€ž z herbem rodu, ktÄ‚Ĺ‚ry oficjalnie nie istnieje", "mapa z jednym nieopisanym szlakiem", "klucz bez pasujĂ„â€¦cego zamka w pobliÄąÄ˝u", "maÄąâ€šy relikwiarz pachnĂ„â€¦cy ozonem", "nÄ‚Ĺ‚ÄąÄ˝ z koÄąâ€şcianĂ„â€¦ rĂ„â„˘kojeÄąâ€şciĂ„â€¦ i Äąâ€şwieÄąÄ˝Ă„â€¦ rysĂ„â€¦", "ksiĂ„â„˘ga rachunkowa z wyrwanymi stronami", "fiolka z pÄąâ€šynem, ktÄ‚Ĺ‚ry nie zamarza")),
                section("Dziwny detal", pick("jedna moneta jest ciepÄąâ€ša", "opakowanie pachnie kadzidÄąâ€šem", "na metalu widaĂ„â€ˇ Äąâ€şwieÄąÄ˝e zadrapania", "w sakiewce jest czyjÄąâ€ş mleczny zĂ„â€¦b", "przedmiot cichnie, gdy pada na niego Äąâ€şwiatÄąâ€šo", "na materiale wyszyto znak lokalnej frakcji")),
                section("Sekret", pick("KtoÄąâ€ş rozpozna ten Äąâ€šup i bĂ„â„˘dzie chciaÄąâ€š wiedzieĂ„â€ˇ, skĂ„â€¦d gracze go majĂ„â€¦.", "Najcenniejszy przedmiot jest dowodem w cudzej sprawie.", "ÄąÂup pochodzi z miejsca, ktÄ‚Ĺ‚re wedÄąâ€šug mapy nie istnieje.", "Prawdziwa wartoÄąâ€şĂ„â€ˇ kryje siĂ„â„˘ w znaku, nie w materiale."))
        );
    }

    private String purseCoins() {
        return pick(
                roll(2, 8) + " cp, " + roll(1, 6) + " sp",
                roll(1, 12) + " cp, " + roll(2, 4) + " sp, " + roll(1, 2) + " gp",
                roll(3, 6) + " cp i " + roll(1, 4) + " faÄąâ€šszywe srebrniki",
                roll(1, 6) + " sp, " + roll(1, 4) + " gp i jedna moneta z obcej mennicy",
                roll(4, 10) + " cp w kilku drobnych woreczkach"
        );
    }

    private boolean isPickpocketLoot(String lootType) {
        String normalized = normalize(lootType)
                .replace("ÄąÄ˝", "z")
                .replace("Ä‚Ĺ‚", "o")
                .replace("Ă„â€¦", "a")
                .replace("Ă„â„˘", "e")
                .replace("Äąâ€š", "l")
                .replace("Äąâ€ş", "s")
                .replace("Ă„â€ˇ", "c")
                .replace("Äąâ€ž", "n")
                .replace("ÄąĹź", "z");
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
            case "dungeon_concept" -> pick("Krypta Bez Dzwieku", "Kopalnia Pod Zlamanym Szczytem", "Swiatynia Zapomnianej Przysiegi");
            case "dungeon_room" -> pick("Sala Popiolowych Znakow", "Komnata Peknietej Studni", "Zbrojownia Bez Cieni");
            case "monster_variant" -> pick("Mglowy Wilkor", "Kosciany Troll z Bagien", "Ghul Korzeni");
            case "magic_item" -> pick("Klucz Ostatniego Progu", "Pierscien Cudzego Glosu", "Latarnia Bez Plomienia");
            case "quest_fantasy" -> pick("Dlug spod Czarnego Mostu", "Zaginiony Herold", "Cena Spokojnej Nocy");
            case "npc_fantasy" -> pick("Eryn z Polnocnych Drog", "Bram Kossfeld", "Sibylle bez Nazwiska");
            case "encounter_fantasy" -> pick("Patrol z Nieoczekiwanym Rozkazem", "Uzbrojony Kurierski Konwoj", "Poszukiwacze bez Zleceniodawcy");
            case "trap_fantasy" -> pick("Pulapka Budowniczego Krypt", "Mechanizm Starej Wiey", "Magiczna Przeszkoda Bez Nazwy");
            case "loot_fantasy" -> pick("Sakwa Nieplanowanej Ucieczki", "Skrzynka zastawiona jako dÄąâ€šug", "ÄąÂup bez mapy powrotnej", "Depozyt pod zÄąâ€šamanĂ„â€¦ pieczĂ„â„˘ciĂ„â€¦", "Paczka z cudzym herbem", "Reszta po zaginionym poborcy");
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
            case "loot_fantasy" -> new Spec("ÄąÂup");
            case "faction_fantasy" -> new Spec("Frakcja fantasy");
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



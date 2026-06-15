package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@Component
public class WorldbuildingQuickGeneratorStrategy implements GeneratorStrategy {
    private static final Set<String> FANTASY = Set.of(
            "fantasy_world", "calendar_fantasy", "demographics_fantasy",
            "castle_fantasy", "five_room_dungeon", "dungeon_advanced"
    );
    private static final Set<String> HORROR = Set.of("coc_investigator_npc");
    private static final Set<String> SCIFI = Set.of("scifi_world", "star_system");

    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return (FANTASY.contains(generatorCode) && "fantasy.quick".equals(variantCode))
                || (HORROR.contains(generatorCode) && "horror.quick".equals(variantCode))
                || (SCIFI.contains(generatorCode) && "scifi.quick".equals(variantCode));
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        return generate("fantasy_world", "fantasy.quick", request);
    }

    @Override
    public GeneratorStructuredResultResponse generate(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = new LinkedHashMap<>(request == null || request.params() == null ? Map.of() : request.params());
        String title = title(generatorCode, params);
        return new GeneratorStructuredResultResponse(
                null,
                generatorCode,
                variantCode,
                title,
                label(generatorCode) + " - " + subtitleCategory(generatorCode, params) + " - opisowy",
                sections(generatorCode, params, title),
                "seed",
                OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> sections(String code, Map<String, Object> params, String title) {
        return switch (code) {
            case "calendar_fantasy" -> calendar(params, title);
            case "demographics_fantasy" -> demographics(params, title);
            case "castle_fantasy" -> castle(params, title);
            case "five_room_dungeon" -> fiveRoomDungeon(params, title);
            case "dungeon_advanced" -> advancedDungeon(params, title);
            case "coc_investigator_npc" -> horrorNpc(params, title);
            case "scifi_world" -> scifiWorld(params, title);
            case "star_system" -> starSystem(params, title);
            default -> fantasyWorld(params, title);
        };
    }

    private List<GeneratorOutputSection> fantasyWorld(Map<String, Object> params, String title) {
        FantasyWorldFrame frame = fantasyWorldFrame();
        return List.of(
                stats("Fantasy", "Skala", stringParam(params, "scale", "Losowa")),
                section("Tozsamosc świata", title + " to " + frame.identity() + "."),
                section("Magia", pick(
                        "Magia jest powszechna w rytualach, ale rzadka w codziennym użyćiu.",
                        "Magia zanika i każde jej użycie prżyciaga uwage uczonych, władzy albo kultow.",
                        "Magia jest narzedziem elit, przez co zwykli ludzie traktuja ja jak podatki: boja sie jej i potrzebuja.",
                        "Magia jest zakazana oficjalnie, lecz każda większa frakcja ma wlasnych praktykow."
                )),
                section("Geografia", frame.geography()),
                section("Główny konflikt", frame.conflict()),
                section("Wazne centrum władzy", frame.powerCenter()),
                section("Sekret świata", pick(
                        "Ksiezyc jest wiezieniem dla czegoś, co zaczyna snic przez ludzi.",
                        "Najstarsze mapy pokazuja kontynent, którego nikt nie pamieta.",
                        "Bogowie nie znikneli. Zmieńili tylko sposób pobierania długów.",
                        "Wszystkie wielkie magie pochodza z jednego bledu, który ktoś chce powtorzyc."
                )),
                section("Jak użyć na sesji", "Daj graczom jeden widoczny konflikt, jedna lokalna konsekwencje i jeden sekret w tle. Świat ma pracowac przy stole, nie tylko brzmiec ladnie.")
        );
    }

    private FantasyWorldFrame fantasyWorldFrame() {
        return switch (random.nextInt(4)) {
            case 0 -> new FantasyWorldFrame(
                    "stary kontynent po upadku kilku imperiow",
                    "Centralny lancuch gor dzieli kontynent na zachod kupiecki i wschod pelen ruin.",
                    "Imperium rozpada sie na ambitne prowincje, a każda twierdzi, ze dziedziczy prawdziwe prawo.",
                    "Zelazna Korona Tharnu - bogata, zdyscyplinowana i coraz bardziej paranoiczna."
            );
            case 1 -> new FantasyWorldFrame(
                    "archipelag setek wysp połączonych handlem, magia i starymi przysiegami",
                    "Wyspy układają sie wokol niebezpiecznego Morza Wewnetrznego; najwazniejsze szlaki prowadza przez cieśniny, rafy i porty-neutralne.",
                    "Kupieckie ligi przejely realna wladze nad szlakami, a dawne korony probuja odzyskac znaczenie przez blokady i piractwo.",
                    "Wolne Miasta Brzegu - chaotyczna liga portow, bogata, niezależna i podatna na szantaz."
            );
            case 2 -> new FantasyWorldFrame(
                    "kraina odbudowana po długim okresie ciemnosci",
                    "Rzeki sa prawdziwymi granicami politycznymi, bo stare drogi przecinaja przeklete puszcze i pola dawnych bitew.",
                    "Dwie religie chca tych samych swietych miejsc, ale żadna nie jest calkiem niewinna.",
                    "Federacja Liliowego Lasu - dyplomatyczna na pokaz, bezlitosna w obronie sekretow."
            );
            default -> new FantasyWorldFrame(
                    "mlody pograniczny świat, gdzie granice dopiero nabieraja znaczenia",
                    "Pustkowia na północy kryją starsze drogi niż obecne osady, a każda nowa mapa szybko sie dezaktualizuje.",
                    "Stara pieczec slabnie, a frakcję spieraja sie, czy ja naprawic, zniszczyc czy wykorzystać.",
                    "Dawne Holdy Karadu - dumne, zadluzone i zamkniete dla obcych."
            );
        };
    }

    private List<GeneratorOutputSection> calendar(Map<String, Object> params, String title) {
        int days = pickInt(6, 7, 8);
        String months = String.join(", ", pick(
                "Glebokozimię, Odwilz, Siew, Jasnokwiat, Sloncegrod, Zniwa, Dymne Pola, Popielnik, Krotkodzien, Koniec Roku",
                "Mroznik, Wilczyc, Blotnik, Zielnik, Zar, Burznik, Plon, Mgielnik, Ciennik, Ostatni Ogien",
                "Pierwszy Deszcz, Mloda Trawa, Wysokie Slonce, Czerwone Zniwo, Cichy Wiatr, Czarne Liscie, Długa Noc, Nowy Plomien"
        ).split(", "));
        return List.of(
                stats("Fantasy", "Dni tygodnia", days),
                section("Nazwa kalendarza", title + " mierzy czas według cyklu prac, świat i dawnych znakow na niebie."),
                section("Tydzien", "Tydzien ma " + days + " dni. Nazwy dni: " + String.join(", ", pickN(
                        List.of("Dzień Słońca", "Dzień Księżyca", "Dzień Żelaza", "Dzień Wody", "Dzień Kupców", "Dzień Przysiąg", "Dzień Odpoczynku", "Dzień Cieni"),
                        days
                )) + "."),
                section("Miesiace", months + ". Miesiace nie musza byc rowne; roznice sa dobrym miejscem na swieta, podatki i przesady."),
                section("Ksiezyce", pick(
                        "Jeden błądy ksiezyc, cykl okolo 29 dni. Pelnie sa ważne dla sadow i przysiag.",
                        "Dwa ksiezyce: jasny i rdzawy. Gdy oba sa pełne, nie zawiera sie malzenstw.",
                        "Trzy male ksiezyce, kazdy zwiazany z innym rodzajem wrozby."
                )),
                section("Swieta", pick(
                        "Noc Długa: wspomina sie zmarlych i nie otwiera drzwi po trzecim pukaniu.",
                        "Pierwszy Siew: długi targ, publiczne pojednania i ukryte umowy.",
                        "Dzień Pustych Dzwonow: swieto ciszy po dawnej wojnie.",
                        "Zniwna Korona: wybiera sie osobe, która przez jeden dzien może obrazic każdego bez kary."
                )),
                section("Dzisiejsza data", "Dzis jest " + (1 + random.nextInt(28)) + ". dzien miesiaca " + pick("Odwilz", "Jasnokwiat", "Plon", "Ciennik") + ", rok " + (800 + random.nextInt(900)) + "."),
                section("Użycie przy stole", "Kalendarz najlepiej działa, gdy daje presje: termin swieta, nadchodzaca pelnie, podatek, zakaz albo dzien, w którym nikt nie chce podrozowac.")
        );
    }

    private List<GeneratorOutputSection> demographics(Map<String, Object> params, String title) {
        String size = stringParam(params, "size", "Losowy");
        int population = populationFor(size);
        return List.of(
                stats("Fantasy", "Populacja", population),
                section("Typ osady", title + " to " + sizeLabel(size) + " liczaca okolo " + population + " mieszkańców."),
                section("Grupy mieszkańców", "Ludzie stanowia największa grupe, ale widoczne sa tez mniejszosci: " + String.join(", ", pickN(
                        List.of("krasnoludzcy rzemieślnicy", "elficcy uchodźcy", "niziołecy handlarze", "półorkowie najemnicy", "gnomscy skrybowie", "rodziny z dalekiego pogranicza"),
                        3
                )) + "."),
                section("Zawody", "Najwięcej jest rolników, tragarzy i rzemieślników. Wpływ mają: " + String.join(", ", pickN(
                        List.of("mlodynarze", "kowale", "przewoznicy", "kapłani", "straznicy", "aptekarze", "pisarze", "rybacy"),
                        4
                )) + "."),
                section("Języki i religia", "Na targu słychać " + String.join(", ", pickN(List.of("wspólny", "krasnoludzki", "elficki", "orkowy", "język kupiecki", "stary dialekt lokalny"), 3)) + ". Dominująca wiara: " + pick("Kościół Słońca", "Stara Wiara", "kult patrona rzeki", "brak jednej dominujacej religii") + "."),
                section("Napiecie spoleczne", pick(
                        "Nowi przybysze sa potrzebni do pracy, ale obwinia sie ich za wzrost cen.",
                        "Cech kontroluje dostęp do pracy i blokuje ludzi spoza rodzin.",
                        "Religia i handel sa splecione, wiec kazdy spor ekonomiczny szybko staje sie moralny.",
                        "Wladza udaje stabilnosc, ale wszyscy wiedza, ze zapasy sa niższe niż oficjalnie."
                )),
                section("Hak dla MG", "Uzyj demografii do decyzji: kto ma informacje, kto boi sie zmian, kto może pomoc i kto straci, jesli gracze rozwiążą problem.")
        );
    }

    private List<GeneratorOutputSection> castle(Map<String, Object> params, String title) {
        String type = stringParam(params, "castleType", "Losowy");
        return List.of(
                stats("Fantasy", "Typ", type),
                section("Opis", title + " to " + (isRandom(type) ? pick("zamek na wzgorzu", "twierdza rzeczna", "forteca graniczna", "nadmorski bastion") : type.toLowerCase()) + ", widoczny z daleka i trudny do zignorowania."),
                section("Stan", pick(
                        "Dobrze utrzymany, ale jedna część pozostaje zamknieta od lat.",
                        "Częściowo zrujnowany po dawnym oblężeniu, mimo to nadal zamieszkany.",
                        "Niedawno odbudowany, przez co starsze fundamenty nie pasuja do nowych murow.",
                        "Zbyt cichy jak na miejsce z taką liczbą strażników."
                )),
                section("Cechy szczegolne", String.join("; ", pickN(
                        List.of("ukryta furta w murze", "studnia na dziedzincu", "kaplica bez symboli", "wieza sygnalowa", "stare lochy", "biblioteka z zamknietym skrzydlem", "sucha fosa", "most zwodzony z nowym mechaniżmem"),
                        3
                )) + "."),
                section("Władca", pick(
                        "zubożaly rod szlachecki, który ukrywa skale długów",
                        "weteran wojenny trzymajacy porzadek bardziej sila niż prawem",
                        "rada zarzadcow, gdzie kazdy reprezentuje inna frakcję",
                        "czarodziejka, która kupiła zamek, ale nie otrzymała wszystkiego, co pod nim leży"
                )),
                section("Problem", pick(
                        "Garniżon jest podzielony i czeka tylko na pretekst do buntu.",
                        "W nocy ktoś otwiera jedna z bram od srodka.",
                        "Pod zamkiem znaleziono tunel starszy niż sama warownia.",
                        "Władca potrzebuje pomocy, ale oficjalnie nie może jej poprosic."
                )),
                section("Sekret", pick(
                        "Zamek zbudowano jako wiezienie, nie rezydencje.",
                        "Prawowity dziedzic zyje pod innym nazwiskiem.",
                        "Jedna z wiez nie rzuca cienia przy pelni.",
                        "Mapa lochow w dokumentach jest celowo bledna."
                ))
        );
    }

    private List<GeneratorOutputSection> fiveRoomDungeon(Map<String, Object> params, String title) {
        String setting = dungeonSetting(params);
        String theme = dungeonTheme(params, setting);
        DungeonFrame frame = dungeonFrame(setting, theme);
        DungeonMapData map = dungeonMapData(theme, 5, 34, 22, true);
        addEntranceMarker(map);
        List<DungeonRoom> rooms = dungeonRooms(setting, theme);
        return List.of(
                new GeneratorOutputSection("stats", "Plan lochu", null, List.of(
                        item("Setting", setting),
                        item("Motyw", theme),
                        item("Cel wyprawy", frame.goal()),
                        item("Główne zagrożenie", frame.threat())
                )),
                section("Wejście", frame.entrance()),
                section("Pokój #1", rooms.get(0).description()),
                section("Pokój #2", rooms.get(1).description()),
                section("Pokój #3", rooms.get(2).description()),
                section("Pokój #4", rooms.get(3).description()),
                section("Pokój #5", rooms.get(4).description()),
                dungeonMapSection(map)
        );
    }

    private List<GeneratorOutputSection> advancedDungeon(Map<String, Object> params, String title) {
        String setting = dungeonSetting(params);
        String theme = dungeonTheme(params, setting);
        int roomCount = intParam(params, "roomCount", 10, 5, 11);
        int floors = intParam(params, "floors", 1, 1, 5);
        DungeonFrame frame = dungeonFrame(setting, theme);
        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(new GeneratorOutputSection("stats", "Plan lochu", null, List.of(
                item("Setting", setting),
                item("Motyw", theme),
                item("Pomieszczenia", roomCount),
                item("Piętra", floors),
                item("Cel wyprawy", frame.goal()),
                item("Główne zagrożenie", frame.threat())
        )));
        List<DungeonMapData> maps = new ArrayList<>();
        for (int floor = 1; floor <= floors; floor++) {
            maps.add(dungeonMapData(theme, roomCount, 44, 28, false));
        }
        addFloorMarkers(maps);
        for (int floor = 1; floor <= floors; floor++) {
            DungeonMapData map = maps.get(floor - 1);
            sections.add(new GeneratorOutputSection("dungeon_map", floors == 1 ? "Mapa" : "Mapa - poziom " + floor, map.gridText(), List.of(
                    item("Legenda", floorLegend(floor, floors)),
                    item("Pokoje", map.rooms().size())
            )));
            sections.add(dungeonRoomListSection(
                    floors == 1 ? "Pomieszczenia" : "Pomieszczenia - poziom " + floor,
                    dungeonRooms(setting, theme, map.rooms().size())
            ));
        }
        return sections;
    }

    private String floorLegend(int floor, int floors) {
        List<String> parts = new ArrayList<>(List.of("ciemne: ściany", "szare: korytarze", "jasne: pokoje", "cyfry: numery pokoi"));
        if (floor == 1) {
            parts.add("E: wejście");
        }
        if (floor > 1) {
            parts.add("↑: wyżej");
        }
        if (floor < floors) {
            parts.add("↓: niżej");
        }
        return String.join(", ", parts);
    }

    private void addFloorMarkers(List<DungeonMapData> maps) {
        if (maps.isEmpty() || maps.get(0).rooms().isEmpty()) {
            return;
        }
        int[] entrance = markerEdgePoint(maps.get(0).grid(), maps.get(0).rooms().get(0), 0, 0);
        markRoom(maps.get(0).grid(), entrance, -1);

        int anchorX = entrance[0];
        int anchorY = entrance[1];
        for (int index = 0; index < maps.size() - 1; index++) {
            DungeonMapData lower = maps.get(index);
            DungeonMapData upper = maps.get(index + 1);
            MapRoom lowerRoom = farthestRoomFrom(lower.rooms(), anchorX, anchorY);
            int[] down = markerEdgePoint(lower.grid(), lowerRoom, anchorX, anchorY);
            markRoom(lower.grid(), down, -3);

            MapRoom upperRoom = nearestRoomTo(upper.rooms(), down[0], down[1]);
            int[] up = markerEdgePoint(upper.grid(), upperRoom, down[0], down[1]);
            markRoom(upper.grid(), up, -2);
            anchorX = up[0];
            anchorY = up[1];
        }
    }

    private void addEntranceMarker(DungeonMapData map) {
        if (map.rooms().isEmpty()) {
            return;
        }
        int[] entrance = markerEdgePoint(map.grid(), map.rooms().get(0), 0, 0);
        markRoom(map.grid(), entrance, -1);
    }

    private void markRoom(int[][] grid, int[] point, int marker) {
        if (inBounds(grid, point[0], point[1])) {
            grid[point[1]][point[0]] = marker;
        }
    }

    private MapRoom nearestRoomTo(List<MapRoom> rooms, int x, int y) {
        MapRoom best = rooms.get(0);
        int bestDistance = Math.abs(best.centerX() - x) + Math.abs(best.centerY() - y);
        for (MapRoom room : rooms) {
            int distance = Math.abs(room.centerX() - x) + Math.abs(room.centerY() - y);
            if (distance < bestDistance) {
                best = room;
                bestDistance = distance;
            }
        }
        return best;
    }

    private MapRoom farthestRoomFrom(List<MapRoom> rooms, int x, int y) {
        MapRoom best = rooms.get(rooms.size() - 1);
        int bestDistance = Math.abs(best.centerX() - x) + Math.abs(best.centerY() - y);
        for (MapRoom room : rooms) {
            int distance = Math.abs(room.centerX() - x) + Math.abs(room.centerY() - y);
            if (distance > bestDistance) {
                best = room;
                bestDistance = distance;
            }
        }
        return best;
    }

    private int[] markerEdgePoint(int[][] grid, MapRoom room, int targetX, int targetY) {
        int[] best = new int[]{room.x(), room.y()};
        int bestScore = Integer.MAX_VALUE;
        for (int y = room.y(); y < room.y() + room.height(); y++) {
            for (int x = room.x(); x < room.x() + room.width(); x++) {
                boolean edge = x == room.x()
                        || x == room.x() + room.width() - 1
                        || y == room.y()
                        || y == room.y() + room.height() - 1;
                if (!edge || (x == room.centerX() && y == room.centerY())) {
                    continue;
                }
                int score = Math.abs(x - targetX) + Math.abs(y - targetY);
                if (touchesCorridor(grid, x, y)) {
                    score += 10_000;
                }
                if (score < bestScore) {
                    best = new int[]{x, y};
                    bestScore = score;
                }
            }
        }
        return best;
    }

    private boolean touchesCorridor(int[][] grid, int x, int y) {
        int[][] directions = {
                {1, 0},
                {-1, 0},
                {0, 1},
                {0, -1}
        };
        for (int[] direction : directions) {
            int nx = x + direction[0];
            int ny = y + direction[1];
            if (inBounds(grid, nx, ny) && (grid[ny][nx] == 1 || grid[ny][nx] == 3)) {
                return true;
            }
        }
        return false;
    }

    private String dungeonSetting(Map<String, Object> params) {
        String resólved = stringParam(params, "_resólvedDungeonSetting", "");
        if (!resólved.isBlank()) {
            return resólved;
        }
        String requested = stringParam(params, "setting", "Fantasy");
        if (!isRandom(requested)) {
            params.put("_resólvedDungeonSetting", requested);
            return requested;
        }
        String setting = pick("Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny");
        params.put("_resólvedDungeonSetting", setting);
        return setting;
    }

    private String dungeonTheme(Map<String, Object> params, String setting) {
        String resólved = stringParam(params, "_resólvedDungeonTheme", "");
        if (!resólved.isBlank()) {
            return resólved;
        }
        String requested = stringParam(params, "theme", "Losowy");
        if (!isRandom(requested)) {
            params.put("_resólvedDungeonTheme", requested);
            return requested;
        }
        String theme;
        if ("Horror".equalsIgnoreCase(setting)) {
            theme = pick("Opuszczony szpital", "Piwnice sanatorium", "Dom za lasem", "Kanalizacja pod miastem", "Kostnica", "Bunkier z lat wojny", "Hotel bez gości", "Stacja metra");
        } else if ("Sci-Fi".equalsIgnoreCase(setting)) {
            theme = pick("Wrak statku", "Stacja orbitalna", "Laboratorium korporacji", "Kopalnia asteroid", "Baza na księżycu", "Moduł terraformujący", "Opuszczony frachtowiec", "Archiwum AI");
        } else if ("Postapo".equalsIgnoreCase(setting)) {
            theme = pick("Schron", "Metro po katastrofie", "Zatopiony supermarket", "Fabryka filtrów", "Stara baza wojskowa", "Osada pod tamą", "Magazyn leków", "Tunel ewakuacyjny");
        } else if ("Realistyczny".equalsIgnoreCase(setting)) {
            theme = pick("Zamknięty magazyn", "Podziemią kamienicy", "Stary fort", "Nieczynny hotel", "Piwnica komisariatu", "Tunel przemytników", "Archiwum miejskie", "Kanały techniczne");
        } else {
            theme = pick(
                    "Krypta", "Kopalnia", "Świątynia", "Wieża maga", "Kryjówka bandytów", "Ruiny krasnoludzkie",
                    "Katakumby", "Podziemny akwedukt", "Zapomniane więzienie", "Grobowiec rodu", "Sanktuarium kultu",
                    "Jaskinia potworów", "Zatopione ruiny", "Magiczne laboratorium", "Stara kanalizacja"
            );
        }
        params.put("_resólvedDungeonTheme", theme);
        return theme;
    }

    private DungeonFrame dungeonFrame(String setting, String theme) {
        String key = normalize(theme);
        String atmosphere = switch (key) {
            case "krypta", "katakumby", "grobowiec rodu" -> pick(
                    "Powietrze jest chłodne, suche i pachnie starym wapnem.",
                    "Każdy dźwięk wraca echem jak szept spod kamienia.",
                    "Groby są opisane poprawnie, ale jedna data nie pasuje do historii."
            );
            case "kopalnia", "ruiny krasnoludzkie" -> pick(
                    "Belki pracują cicho, a pył zdradza świeże ślady.",
                    "Stare znaki górnicze ostrzegają przed szybem, którego nie ma na mapie.",
                    "Metaliczny stuk niesie się z głębi, mimo że nikt tam nie powinien pracować."
            );
            case "świątynia", "sanktuarium kultu" -> pick(
                    "Święte symbole są przemalowane, jakby ktoś poprawiał cudzą wiarę.",
                    "Zapach kadzidła miesza się z wilgoćią i krwią.",
                    "Miejsce nadal reaguje na modlitwy, tylko nie zawsze na właściwe."
            );
            case "wieża maga", "magiczne laboratorium" -> pick(
                    "Geometria korytarzy jest lekko błędna, jakby przestrzeń była pożyczona.",
                    "Światło nie pada zgodnie z kierunkiem pochodni.",
                    "Notatki na ścianach opisują eksperyment, który nadal trwa."
            );
            case "kryjówka bandytów", "zapomniane więzienie", "stara kanalizacja" -> pick(
                    "Widać świeże naprawy, stare brudy i ślady szybkiej ewakuacji.",
                    "To miejsce jest praktyczne, ciasne i pełne drobnych pułapek.",
                    "Ktoś zna tu każdą boczną drogę i zostawił znaki dla swoich."
            );
            default -> pick(
                    "Miejsce wygląda na opuszczone, ale ktoś niedawno oczyścił główne przejście.",
                    "W powietrzu czuć wilgoć, popiół i stary metal.",
                    "Na ścianach są ostrzeżenia zapisane w kilku różnych epokach."
            );
        };

        return new DungeonFrame(
                atmosphere,
                pick(goalOptions(normalize(setting), key)),
                pick(threatOptions(normalize(setting), key)),
                pick(entranceOptions(key)),
                pick(challengeOptions(key)),
                pick(twistOptions(key)),
                pick(climaxOptions(key)),
                pick(rewardOptions(key))
        );
    }

    private List<String> goalOptions(String setting, String key) {
        if (setting.contains("horror")) {
            return List.of("znaleźć źródło zniknięć", "odzyskać dowód, zanim policja zamknie sprawę", "sprawdzić, kto przeżył noc w środku", "zabrać przedmiot, którego nikt nie chce dotknąć");
        }
        if (setting.contains("sci-fi")) {
            return List.of("odzyskać rdzeń danych", "wyłączyć uszkodzoną AI", "znaleźć zaginioną załogę", "zabezpieczyć próbkę przed korporacją");
        }
        if (setting.contains("postapo")) {
            return List.of("zdobyć filtry, wodę albo leki", "odnaleźć zaginiony patrol", "uruchomić stary generator", "sprawdzić, czy miejsce nadaje się na kryjówkę");
        }
        if (setting.contains("realistyczny")) {
            return List.of("znaleźć ukryty magazyn", "zdobyć dokumenty", "wyprowadzić świadka", "sprawdzić, kto korzysta z podziemi");
        }
        if (key.contains("krypta") || key.contains("katakumby") || key.contains("grobowiec")) {
            return List.of("odzyskać relikwię z grobu", "odnaleźć ciało, którego nie powinno tu być", "sprawdzić, kto narusza pochówki", "zamknąć przejście pod nekropolią");
        }
        if (key.contains("kopalnia") || key.contains("krasnoludzkie")) {
            return List.of("odnaleźć zaginioną ekipę", "wydobyć rzadką rudę", "zamknąć przebity szyb", "odzyskać mapę starych chodników");
        }
        if (key.contains("świątynia") || key.contains("sanktuarium")) {
            return List.of("przerwać rytuał", "odzyskać święty znak", "sprawdzić zniknięcie kapłana", "oczyścić splugawiony ołtarz");
        }
        if (key.contains("wieża") || key.contains("laboratorium")) {
            return List.of("zabrać księgę zaklęć", "wyłączyć niestabilny eksperyment", "odnaleźć ucznia maga", "odzyskać przedmiot z pracowni");
        }
        return List.of("znaleźć zaginioną osobę", "odzyskać skradziony przedmiot", "zbadać dziwne hałasy", "usunąć zagrożenie blokujące okolicę");
    }

    private List<String> threatOptions(String setting, String key) {
        if (setting.contains("horror")) {
            return List.of("obecność, która zna imiona intruzów", "człowiek udający ofiarę", "rytuał powtarzający ostatnią noc", "coś zamknięte w ścianach", "dowód, który zmienia wspomnienia");
        }
        if (setting.contains("sci-fi")) {
            return List.of("uszkodzona AI traktująca intruzów jak infekcję", "drony serwisowe z błędnym protokołem", "wyciek biologiczny", "piraci szukający tego samego", "system próżniowy odcinający sekcje");
        }
        if (setting.contains("postapo")) {
            return List.of("skażenie i brak czasu", "banda szabrowników", "głód, który zmieńił ludzi w wrogów", "stare zabezpieczenia wojskowe", "mutacja pilnująca zapasów");
        }
        if (setting.contains("realistyczny")) {
            return List.of("uzbrojeni ludzie pilnujący przejścia", "zawalenie konstrukcji", "kamera, alarm albo czujnik ruchu", "ktoś ukryty w środku", "presja czasu przed przyjazdem służb");
        }
        return List.of(
                "strażnik, który nie rozumie, że jego pan nie żyje",
                "lokalna banda wykorzystująca stare przejścia",
                "rytuał uruchamiający się po wejściu intruzów",
                "potwór broniący nie skarbu, tylko wyjścia",
                "magiczna awaria zmieniająca układ pomieszczeń",
                "druga grupa poszukiwaczy z innym zleceniem"
        );
    }

    private List<String> entranceOptions(String key) {
        return List.of(
                "Zablokowane drzwi mają trzy znaki: jeden otwiera przejście, drugi alarmuje strażnika, trzeci budzi coś w ścianie.",
                "Przedsionek pilnuje ranny wartownik, który chce negocjować, ale ukrywa, że za nim jest pułapka.",
                "Wejście wygląda bezpiecznie, dopóki ostatnia osoba nie przekroczy progu i kraty nie odetną odwrotu.",
                "Mostek nad czarną szczeliną skrzypi przy każdym cięższym kroku; po drugiej stronie czeka ktoś z kuszą.",
                "Kamienna figura żąda hasła, lecz przyjmie też ofiarę, prawdę albo dobrze odegraną pewność siebie."
        );
    }

    private List<String> challengeOptions(String key) {
        return List.of(
                "Sala wymaga ustawienia trzech symboli według wskazówki ukrytej w poprzednim pomieszczeniu.",
                "Uwięziony NPC zna dalszą drogę, ale boi się powiedzieć, co zostawił w czwartym pokoju.",
                "Duch budowniczego przepuści drużynę, jeśli obiecają naprawić jego błąd zamiast tylko zabrać skarb.",
                "Stół z mapą pokazuje prawdziwy układ lochu, ale każda zmiana na mapie porusza coś w rzeczywistości.",
                "Drzwi otwierają się tylko wtedy, gdy bohaterowie oddadzą rzecz, którą uznają za nieistotną."
        );
    }

    private List<String> twistOptions(String key) {
        return List.of(
                "Skarb w tej sali jest przynętą; zabranie go przesuwa główne zagrożenie bliżej wyjścia.",
                "Pomieszczenie zaczyna się zalewać, gdy ktoś dotknie właściwego tropu.",
                "Sojusznik z poprzedniej sceny ujawnia własny plan i próbuje zamknąć drużynę w środku.",
                "Drzwi za plecąmi prowadzą teraz do innego miejsca, więc powrót wymaga decyzji albo kosztu.",
                "Najbardziej oczywisty przeciwnik okazuje się strażnikiem trzymającym większy problem w ryzach."
        );
    }

    private List<String> climaxOptions(String key) {
        return List.of(
                "Walka toczy się wokół niestabilnego centrum sali; co rundę coś pęka, gaśnie albo spada.",
                "Przeciwnik próbuje dokończyć rytuał i można go powstrzymać walką, negocjacją albo zniszczeniem podpory.",
                "Główne stworzenie nie chce umrzeć, tylko odzyskać rzecz, którą drużyna mogła już znaleźć.",
                "Druga grupa poszukiwaczy wchodzi do sali w najgorszym momencie i zmienia układ sił.",
                "Zagrożenie zna sekret lochu i oferuje go w zamian za wypuszczenie."
        );
    }

    private List<String> rewardOptions(String key) {
        return List.of(
                "Nagroda jest użyteczna od razu, ale ma znak właściciela, który po nią przyjdzie.",
                "Prawdziwym skarbem jest informacją: loch był tylko wejściem do większej sprawy.",
                "Drużyna znajduje relikwię i dowód, że zleceniodawca pominął najważniejszy szczegół.",
                "Ocalona osoba wie, jak wyjść, lecz nie jest tą osobą, za którą ją wzięto.",
                "Zabranie skarbu zamyka obecny problem, ale otwiera nowe przejście na mapie."
        );
    }

    private List<DungeonRoom> dungeonRooms(String setting, String theme) {
        return dungeonRooms(setting, theme, 5);
    }

    private List<DungeonRoom> dungeonRooms(String setting, String theme, int count) {
        List<String> picked = pickN(roomOptions(normalize(setting), normalize(theme)), count);
        List<DungeonRoom> rooms = new ArrayList<>();
        for (int i = 0; i < picked.size(); i++) {
            rooms.add(new DungeonRoom(i + 1, picked.get(i)));
        }
        return rooms;
    }

    private GeneratorOutputSection dungeonRoomListSection(String title, List<DungeonRoom> rooms) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (DungeonRoom room : rooms) {
            items.add(item("Pokój #" + room.number(), room.description()));
        }
        return new GeneratorOutputSection("dungeon_rooms", title, null, items);
    }

    private List<String> roomOptions(String setting, String theme) {
        if (setting.contains("horror")) {
            return List.of(
                    "Pokój jest prawie pusty; na środku stoi krzesło przywiązane pasami, a pod nim świeża kałuża, której nikt nie zostawił.",
                    "Ściany są pokryte zdjęciami tej samej osoby, ale każde pokazuje ją w innym wieku i przy innych drzwiach.",
                    "W szafkach leżą opisane próbki; jedna ma nazwisko bohatera i datę sprzed dziesięciu lat.",
                    "Zamknięte drzwi stukają od środka trzy razy, zawsze zanim ktoś wypowie kłamstwo.",
                    "Na podłodze narysowano krąg z sóli i popiołu; przerwanie linii uciszą cały budynek.",
                    "Wanna, stół operacyjny albo łóżko jest czyste, ale odpływ pod nim nadal pracuje.",
                    "Radio gra lokalne wiadomości z jutra i przerywa, gdy ktoś spróbuje zapisać szczegóły.",
                    "Lustro pokazuje pomieszczenie bez drużyny, za to z kimś stojącym przy wyjściu.",
                    "Szafa jest zabita deskami od środka; między deskami wystaje dziecięcy rysunek mapy budynku.",
                    "Na suficie wiszą mokre ślady dłoni, które kończą się dokładnie nad najcichszą osobą w drużynie.",
                    "Kartoteka zawiera akta ludzi, którzy dopiero mają tu wejść; przy jednym nazwisku dopisano godzinę śmierci.",
                    "W kącie stoi manekin ubrany jak zaginiony świadek, a jego kieszeń kryje prawdziwy klucz.",
                    "Pod dywanem ukryto właz do wąskiego szybu, z którego dobiega oddech zsynchroniżowany z oddechem graczy.",
                    "Zegar ścienny cofa się o minutę po każdym głośnym dźwięku.",
                    "Łóżka są równo pościelone, lecz pod każdym materacem leży ta sama mokra fotografia.",
                    "W zamrażarce nie ma ciał, tylko podpisane worki z rzeczami osób, które jeszcze żyją.",
                    "Korytarz widoczny przez okno nie istnieje na planie budynku.",
                    "Maszyna do pisania sama zapisuje ostatnie słowa osoby, która dotknie klawiszy.",
                    "Plama na ścianie układa się w mapę, jeśli polać ją czystą wodą.",
                    "W pokoju dziecięcym zabawki patrzą w stronę zamkniętej kratki wentylacyjnej.",
                    "Telefon bez kabla dzwoni tylko wtedy, gdy ktoś stoi plecąmi do wyjścia.",
                    "W pralni obraca się jedna pusta pralka; w bębnie słychać pukanie z innego piętra.",
                    "Ołtarzyk z domowych przedmiotów wskazuje, że ktoś próbował tu odprawić rytuał ochronny i przegrał.",
                    "Na podłodze leży świeży raport policyjny opisujący dokładnie tę scenę, ale z inną liczbą osób.",
                    "W ścianie jest nisza z maską; po jej zdjęciu wszyscy słyszą cudze wspomnienie.",
                    "Korytarz kończy się drzwiami namalowanymi na ścianie; klamka jest jednak prawdziwa i ciepła.",
                    "W prosektorium wszystkie szuflady są puste poza jedną, która od środka prosi o ciszę.",
                    "Sala terapii ma krąg krzeseł i magnetofon odtwarzający rozmowę, której nikt nie powinien znać.",
                    "Piwniczny magazyn pachnie deszczem, choć nad budynkiem od tygodni jest susza.",
                    "Klatka schodowa prowadzi pół piętra niżej niż powinna i wraca w inne miejsce.",
                    "W pokoju projekcyjnym film pokazuje drużynę stojącą przed ekranem kilka minut później.",
                    "Ściana z aktami jest pusta, ale po zgaszeniu światła pojawiają się na niej nazwiska.",
                    "W małej kaplicy świeci jedna świeca; gaśnie, gdy ktoś mówi prawdę.",
                    "Pod stołem leży świeży odcisk mokrej stopy, zbyt duży jak na człowieka.",
                    "Kafelki na podłodze układają się w strzałkę, ale tylko w odbiciu latarki."
            );
        }
        if (setting.contains("sci-fi")) {
            return List.of(
                    "Komora serwisowa jest przecięta czerwonym laserem diagnostycznym; przejście przez wiązkę budzi drony naprawcze.",
                    "Kapsuły kriogeniczne stoją otwarte, a komputer twierdzi, że załoga nadal śpi.",
                    "Rdzeń danych lewituje w polu magnetycznym; każde pobranie pliku kasuje losowy zapis z pamięci stacji.",
                    "Śluza awaryjna ma pękniętą szybę i odlicza do automatycznego odpowietrzenia sekcji.",
                    "Hydroponika zarosła czarną pleśnią, która reaguje na głos i porusza się tylko w ciszy.",
                    "Terminal AI odpowiada uprzejmie, lecz konsekwentnie nazywa intruzów objawami infekcji.",
                    "Magazyn części zawiera dokładnie to, czego drużyna potrzebuje, oraz aktywny nadajnik korporacyjny.",
                    "W centrum sali wiruje mapa gwiezdna z jedną planetą oznaczoną jako 'nie otwierać'.",
                    "Warsztat robotyczny składa z resztek maszynę o twarzy ostatniej osoby, która tu zginęła.",
                    "Pokój dekontaminacji nie otwórzy drugich drzwi, dopóki ktoś nie przyzna się do skażenia.",
                    "Laboratorium próżniowe trzyma w polu siłowym narzędzie, które nie powinno istnieć w tej epoce.",
                    "Serwerownia chłodzi się ciekłym azotem; alarm cieplny wskazuje jedną żywą istotę za szafami.",
                    "Mesa załogi ma świeże posiłki, ale datownik pokazuje ostatni cykl sprzed dwudziestu lat.",
                    "Moduł medyczny diagnozuje zdrowych ludzi jako martwych i proponuje natychmiastową utylizację.",
                    "Hangar ma jedną kapsułę ratunkową mniej niż w manifestach i jeden ślad startu więcej.",
                    "Winda grawitacyjna zatrzymuje się między pokładami i odtwarza rozmowę, której nikt nie odbył.",
                    "Pokład sensorów widzi coś ogromnego tuż obok statku, choć przez okno widać tylko gwiazdy.",
                    "Archiwum misji ma zamknięty folder z nazwą aktualnej drużyny.",
                    "Reaktor pulsuje nierówno; każde zbliżenie zmienia na chwilę wspomnienia jednej osoby.",
                    "Magazyn broni otwiera się bez oporu, ale każda sztuka amunicji ma inny numer seryjny niż broń.",
                    "Sala odpraw ma hologram kapitana, który rozpoznaje tylko jednego intruza jako członka załogi.",
                    "Kanał techniczny jest zbyt czysty i prowadzi do sekcji usuniętej z planów.",
                    "Sonda badawcza wróciła z zewnątrz pusta, choć zapis masy wskazuje pasażera.",
                    "Komora obcych próbek ma pęknięty pojemnik i system gaśniczy pełen sóli.",
                    "Konsóla nawigacyjna proponuje skok do koordynatów opisanych jako 'dom'.",
                    "Drukarka przemysłowa kończy przedmiot zamówiony przez kogoś, kto nie żyje od lat.",
                    "Moduł łączności odbiera prywatne wiadomości załogi, ale wszystkie nadano z przyszłej godziny.",
                    "Pokój map taktycznych pokazuje intruzów jako czerwone plamy, a jedną osobę jako błąd systemu.",
                    "Stacja ładowania pancerzy ma jeden kombinezon zajęty od środka.",
                    "Laboratorium grawitacyjne odwraca kierunek upadku po każdym głośnym poleceniu.",
                    "Maszynownia brzmi jak bijące serce i przyspiesza, gdy drużyna zbliża się do rdzenia.",
                    "Magazyn danych ma fizyczne kasety opisane nazwami planet, których nie ma na mapach.",
                    "Sekcja kwarantanny otwiera się tylko dla osoby uznanej przez system za skażoną.",
                    "Korytarz serwisowy jest pełen kabli, które same odsuwają się od źródła światła.",
                    "Pokój rekreacyjny odtwarza symulację plaży, ale fale nanoszą metalowe szczątki."
            );
        }
        if (setting.contains("postapo")) {
            return List.of(
                    "Pomieszczenie pełne filtrów ma sprawny zapas tylko na jedną grupę; druga grupa już wycelowała broń.",
                    "Stary generator działa, ale każda minuta pracy przyciąga coś z tuneli wentylacyjnych.",
                    "Na ścianie wiszą zasady schronu; ostatnia dopisana krwią zmienia sens wszystkich poprzednich.",
                    "Magazyn żywności jest prawie pusty, a pod skrzynią leży mapa do większych zapasów.",
                    "Korytarz za kratą jest zalany skażoną wodą; w wodzie porusza się światło latarki kogoś niewidocznego.",
                    "Sala odpraw ma działające radio i nagranie SOS, które zaczyna odpowiadać na pytania.",
                    "W izolatce siedzi ocalały z kluczem, ale nie chce wyjść, bo wie, co czeka w następnym pokoju.",
                    "Warsztat zawiera narzędzia, prowizoryczną pułapkę i świeży ślad osoby, która zna ten plan lepiej.",
                    "Sypialnia schronu ma za dużo łóżek jak na oficjalną liczbę mieszkańców.",
                    "Stacja pomp działa ręcznie; jedno uruchomienie daje wodę, drugie budzi alarm w całym kompleksie.",
                    "Kantyna została zamieniona w salę sądu, a wyroki wiszą na tablicy zamiast menu.",
                    "W chłodni przechowywane są leki, mięso i zapieczętowany worek z oznaczeniem 'nie liczyć'.",
                    "Stary punkt kontroli promieniowania pika tylko przy jednym plecąku z drużyny.",
                    "Kanał wentylacyjny prowadzi do pokoju dzieci, gdzie kredą narysowano trasę patrolu.",
                    "Zbrojownia jest zamknięta od zewnątrz, ale od środka ktoś regularnie oliwi broń.",
                    "Szklarnia daje plony, lecz rośliny odwracają liście od jednej konkretnej osoby.",
                    "W centrum dowodzenia działa mapa okolicy z trzema bezpiecznymi trasami, z których dwie są pułapką.",
                    "Kaplica schronu ma ołtarz z części zamiennych i listę imion do usunięcia z racji żywnościowych.",
                    "Tunel ewakuacyjny kończy się świeżo zaspawaną kratą i znakiem obcej osady.",
                    "Magazyn paliwa przecieka; wejście z otwartym ogniem zamieni scenę w decyzję bez czasu.",
                    "Stare ambulatorium ma jedną działającą dawkę antytoksyny i dwóch chorych po przeciwnych stronach konfliktu.",
                    "Pralnia służy jako ukryty targ; sprzedawca oferuje klucz, którego oficjalnie nie ma.",
                    "Komora recyklingu wypluwa metalowe identyfikatory ludzi uznanych za zaginionych.",
                    "Na ścianach dormitorium ktoś zaznaczał dni do otwarcia bramy, a potem zaczął liczyć od nowa.",
                    "Radiostacja łapie sygnał z miejsca, które według map od lat jest pustynią.",
                    "Sala wymiany filtrów ma trzy czyste wkłady i listę osób, którym ich odmówiono.",
                    "Kwatera dowódcy jest splądrowana, lecz mapa odwrotu została przybita do stołu nożem.",
                    "Tunel odpływowy prowadzi do kratki z zewnątrz, gdzie ktoś zostawia świeże znaki kredą.",
                    "Stary automat z wodą działa tylko za żetony znalezione przy martwych strażnikach.",
                    "Magazyn nasion zawiera jedną skrzynkę podpisaną datą z następnego roku.",
                    "Sala generatorów ma ręczny przełącznik i wyraźne ślady po ostatniej walce o prąd.",
                    "Przedsionek śluzy jest pełen notatek ostrzegających przed powrótem na powierzchnię.",
                    "Warsztat rusznikarza ma niedokończoną broń i nabój z wyrytym imięniem.",
                    "Pokój dziecięcy przerobiono na skład amunicji, ale zabawki nadal leżą w równych rzędach.",
                    "Chłodnia z wodą ma działającą pompę i ślad świeżo przeciętego węża."
            );
        }
        if (setting.contains("realistyczny")) {
            return List.of(
                    "Pokój ochrony ma działające monitory; jeden pokazuje drużynę z opóźnieniem, drugi pokazuje ją w miejscu, do którego jeszcze nie weszła.",
                    "Magazyn jest zastawiony paletami, a w najkrótszej drodze ktoś rozpiął cichy alarm z żyłki.",
                    "Biuro archiwisty ma sejf, fałszywą ścianę i kalendarz z dzisiejszą datą zakreśloną trzy razy.",
                    "Klatka schodowa grozi zawaleniem; hałas sprowadzi ludzi z góry szybciej niż sam upadek.",
                    "W pomieszczeniu technicznym buczy transformator, który można wyłączyć, jeśli ktoś zaryzykuje poparzenie.",
                    "Stół konferencyjny jest przygotowany na spotkanie, które powinno odbyć się jutro, ale kawa jest jeszcze ciepła.",
                    "Za zamkniętymi drzwiami słychać telefon; rozmówca zna imię pierwszej osoby, która odbierze.",
                    "Stary tunel przemytników ma świeże ślady opon i ukryty schowek z dokumentami.",
                    "Recepcja wygląda normalnie, ale księga wejść ma podpisy osób, których nie było na kamerach.",
                    "W serwerowni padła klimatyzacja; dyski można uratować tylko kosztem ciszy i czasu.",
                    "Pokój socjalny ma kubki z nazwiskami, a jeden z nich paruje mimo nocnej pory.",
                    "Parking podziemny ma zablokowany wyjazd i samochód z jeszcze ciepłym silnikiem.",
                    "W archiwum akt brakuje jednej teczki, a kurz pokazuje dokładny kształt zabranej skrzynki.",
                    "Pomieszczenie kasowe ma pusty sejf i plik banknotów ułożonych jak strzałka.",
                    "Biuro kierownika skrywa drugi telefon, który dzwoni tylko na numer bez kierunkowego.",
                    "Pracownia konserwatora ma plan budynku z tunelem niewprowadzonym do ewidencji.",
                    "Korytarz techniczny jest za wąski na walkę, ale idealny na pościg albo zasadzkę.",
                    "Sala przesłuchań ma lustro weneckie, za którym nikt nie powinien stać.",
                    "Magazyn dowodów ma zerwaną plombę i pudełko opisane ręką jednej z postaci.",
                    "Piwnica ma świeżo zamurowany fragment; zaprawa jeszcze nie wyschła.",
                    "Winda serwisowa jedzie na piętro, którego nie ma na panelu.",
                    "Pomieszczenie sprzątaczek kryje klucze, uniform i listę obchodów ochrony.",
                    "Kotłownia stuka rytmem, który pasuje do kodu z notatki znalezionej wcześniej.",
                    "Dachowy właz prowadzi do liny spuszczonej z sąsiedniego budynku.",
                    "Nieużywana sala szkoleniowa ma ustawione krzesła dla dokładnej liczby intruzów.",
                    "Pokój księgowości ma niszczarkę pełną świeżych pasków papieru i jeden niedocięty dokument.",
                    "Serwisowy korytarz ma ślady farby na podłodze prowadzące do zamkniętej kratki.",
                    "Biuro prawne skrywa skan podpisanej umowy, której oryginał oficjalnie zaginął.",
                    "Stara portiernia ma komplet kluczy bez jednego numeru i zdjęcie osoby, która je zabrała.",
                    "Magazyn chemii ma przewrócony kanister i maski oddechowe z wyciętymi filtrami.",
                    "Archiwum monitoringu przechowuje jedną kasetę opisaną dzisiejszą godziną.",
                    "Pokój narad ma plan miasta z zaznaczonymi punktami, które tworzą trasę ucieczki.",
                    "Piwniczny schowek ma ślady świeżej ziemi i narzędzie z inicjałami właściciela.",
                    "Zaplecze kuchni pachnie gazem; jedna iskra rozwiąże problem w najgorszy sposób.",
                    "Wąski magazyn tekstyliów ukrywa przebrania, radio i świeży ślad krwi."
            );
        }
        return List.of(
                "Sala ma mozaikę z brakującym fragmentem; włożenie dowolnego przedmiotu uruchamia ukryte drzwi albo kamiennych strażników.",
                "W centrum komnaty stoi posąg z otwartą dłonią; przyjęcie daru daje wskazówkę, odmowa budzi klątwę.",
                "Podłoga jest przecięta bezdenną szczeliną, a runy przy wyjściach tworzą most tylko po wypowiedzeniu właściwego słowa.",
                "Stół ofiarny jest świeżo umyty; pod nim ukryto nóż, klucz i imię następnej ofiary.",
                "Biblioteka ma księgi przykute łańcuchami; jedna księga czyta graczy głośniej, niż oni czytają ją.",
                "Studnia w rogu odbija niebo zamiast sufitu; wrzucona moneta wraca jako mokra przepowiednia.",
                "Komnatę patroluje samotny strażnik, który pilnuje nie skarbu, lecz czegoś zamkniętego za ścianą.",
                "Skarbiec wygląda na otwarty, ale każda zabrana rzecz zmienia układ korytarzy na mapie.",
                "Krąg magiczny na posadzce przyzywa cień, jeśli ktoś przejdzie przez środek sali.",
                "Kolumny wokół ołtarza pękają po kolei; przy każdej pękniętej kolumnie zmienia się grawitacja, światło albo dźwięk.",
                "Zbrojownia ma puste stojaki, lecz cienie broni nadal wiszą w powietrzu i tną przy dotknięciu.",
                "Sala sądu ma kamienne ławy i wyrok zapisany na ścianie imionami żywych ludzi.",
                "Most nad czarną wodą jest cały, dopóki nikt nie spojrzy prosto w dół.",
                "Krypta ma pięć sarkofagów, ale sześć świeżych śladów kurzu po odsuniętych wiekach.",
                "W fontannie pływają złote monety; każda zabrana moneta przywołuje pytanie, na które trzeba odpowiedzieć prawdą.",
                "Warsztat alchemika dymi kolorami; zła fiolka zamienia problem w pożar, dobrą można wykorzystać jak klucz.",
                "Sala z wahadłami zatrzymuje pułapkę tylko wtedy, gdy ktoś porusza się w rytmie starej pieśni.",
                "Korytarz posągów prowadzi przez twarze dawnych złodziei; jeden posąg ma twarz kogoś z drużyny.",
                "Jadalnia jest zastawiona świeżą ucztą, ale każde krzesło nosi wyryte imię gościa.",
                "Kaplica boczna ma ołtarz bez bóstwa; modlitwa do dowolnego imięnia odpowiada głosem spod posadzki.",
                "Sala map pokazuje loch z góry, lecz jedno pomieszczenie przesuwa się, gdy nikt na nie nie patrzy.",
                "Komora z mgłą ukrywa przeciwnika, ale mgła układa się w strzałki, jeśli mówić szeptem.",
                "Pracownia run ma trzy świecące znaki: jeden otwiera drzwi, drugi budzi strażnika, trzeci kłamie.",
                "Stajnia podziemna trzyma kości wierzchowców gotowe ruszyć, jeśli ktoś zagwiżdże.",
                "Zawalona sala kryje przejście pod gruzem i głos proszący, żeby go nie odkopywać.",
                "Sala luster pokazuje drużynę z jedną osobą więcej, a dodatkowa postać wskazuje ukryty schowek.",
                "Komora klepsydr odmierzających cudze życie pozwala kupić czas kosztem hałasu w całym lochu.",
                "Półzalana krypta ma wodę do kolan i coś metalowego przesuwającego się po dnie.",
                "Skarbiec ślubowań przechowuje przysięgi zapisane na srebrnych tabliczkach.",
                "Sala ćwiczeń ma drewniane manekiny, które powtarzają ostatni atak wykonany w pomieszczeniu.",
                "Kuchnia strażników nadal gotuje zupę, choć palenisko wygasło przed wiekami.",
                "Komnata z pękniętym dzwonem ogłusza tylko tych, którzy próbują zabrać skarb.",
                "Pokój straży ma kości przy stole do gry i klucz ukryty w pustej kości do rzutu.",
                "Galeria fresków pokazuje prawdziwą historię lochu, ale ostatni fresk dopiero wysycha.",
                "Sala fontanny uzdrawia drobne rany, lecz każde użycie przywołuje czyjeś wspomnienie."
        );
    }

    private List<GeneratorOutputSection> horrorNpc(Map<String, Object> params, String title) {
        String group = stringParam(params, "occupationGroup", "Losowa");
        return List.of(
                stats("Horror", "Grupa zawodowa", group),
                section("Kim jest", title + " pracuje jako " + occupation(group) + ". Na pierwszy rzut oka to zwykla osoba zwiazana ze sprawa."),
                section("Wygląd", pick(
                        "Blade oczy, staranny ubior i ręce, które ciagle poprawiaja mankiety.",
                        "Zmeczona twarz, notatnik trzymany zbyt mocno i wzrok uciekajacy do drzwi.",
                        "Elegancki wygląd psuje tylko zapach alkoholu, lekow albo wilgoći.",
                        "Mowi spokojnie, ale reaguje za szybko na jedno konkretne slowo."
                )),
                section("Obsesja", pick(
                        "Porownuje wszystkie zdarzenia z jednym starym przypadkiem.",
                        "Zbiera wycinki, mapy i fotografie miejsc, których nigdy nie odwiedzil.",
                        "Wierzy, ze sny sa raportami z innego miejsca.",
                        "Próbuje udowodnic, ze wszystko ma racjonalne wyjasnienie, nawet gdy juz w to nie wierzy."
                )),
                section("Sekret", pick(
                        "Byl obecny przy rytuale, ale zapamietal go jako wypadek.",
                        "Ukrywa tom albo przedmiot, którego nie umie zniszczyc.",
                        "Jego rodzina ma zwiazek z miejscem śledztwa.",
                        "Raz juz widzial istote i przezyl, bo ktoś inny zaplacil cene."
                )),
                section("Stabilnosc psychiczna", pick(
                        "Stabilny, ale zaprzeczenie kosztuje go coraz więcej.",
                        "Nadszarpniety: bezsennosc, luki w pamieci i przesadna czujnosc.",
                        "Kruchy: potrafi działać, dopoki nikt nie dotknie sedna sprawy.",
                        "Na granicy: prawda i urojenie mieszaja sie w uzyteczny, ale niebezpieczny sposób."
                )),
                section("Trop dla graczy", "NPC zna fragment prawdy. Nie musi podac go wprost: może oddac klucz, wskazac nazwisko, rozpoznac symbol albo ostrzec przed miejscem.")
        );
    }

    private List<GeneratorOutputSection> scifiWorld(Map<String, Object> params, String title) {
        return List.of(
                stats("Sci-Fi", "Skala", stringParam(params, "scale", "Losowa")),
                section("Typ świata", title + " to " + pick("kolonia graniczna", "świat korporacyjny", "planeta po terraformacji", "stacja-miasto", "niezależny port orbitalny") + "."),
                section("Poziom technologii", pick(
                        "Technologia jest wysoka, ale nierówno dostępna.",
                        "Kolonia działa na sprzecie drugiej reki i lokalnych obejsciach.",
                        "Systemy sa zautomatyzowane, lecz AI ma ograniczenia, o których nikt nie mowi.",
                        "Miejsce wygląda nowoczesnie, ale infrastruktura jest na granicy awarii."
                )),
                section("Rzad i kultura", pick(
                        "Rzadza kontrakty korporacyjne, a prawo jest dodatkiem do regulaminu.",
                        "Lokalna rada jest wybierana, ale dostęp do tlenu i pracy kontroluje jedna firma.",
                        "Społeczność powstala z uchodzcow i nie ufa żadnej zewnętrznej władzy.",
                        "Kultura opiera sie na statusie technicznym: kto naprawia systemy, ten ma głos."
                )),
                section("Konflikt", pick(
                        "Bunt pracownikow przeciwko warunkom kontraktu.",
                        "Spor o dostęp do punktu skoku albo jedynego portu.",
                        "Kryzys ekologiczny, który administracja ukrywa przed inwestorami.",
                        "Religijny albo ideologiczny rozlam po pierwszym kontakcie z czyms obcym."
                )),
                section("Sekret", pick(
                        "Terraformacja obudzila cos pod powierzchnia.",
                        "Dane zalożycielskie zostały sfalszowane.",
                        "Woda, powietrze albo siec zawiera czynnik zmieniajacy zachowanie ludzi.",
                        "Pod miastem sa ruiny starsze niż ludzka obecnosc w systemie."
                )),
                section("Hak przygodowy", pick(
                        "Drużyna przybywa w chwili, gdy konflikt przechodzi w otwarta faze.",
                        "Jedyna osoba z potrzebna częścia ukrywa sie po zlej stronie sporu.",
                        "Lokalne wladze chca, by drużyna zniknela, ale najpierw potrzebuja pomocy.",
                        "Sygnał alarmowy powtarza sie od miesiecy, choc oficjalnie go nie ma."
                ))
        );
    }

    private List<GeneratorOutputSection> starSystem(Map<String, Object> params, String title) {
        int count = planetCount(params);
        return List.of(
                stats("Sci-Fi", "Planety", count),
                section("Gwiazda", title + " krazy wokol gwiazdy typu " + pick("zolty karzel", "czerwony karzel", "pomaranczowy podolbrzym", "uklad podwojny", "słaby pulsar") + "."),
                section("Planety", planets(count)),
                section("Zagrozenia", String.join("; ", pickN(
                        List.of("gesty pas asteroid", "niestabilny punkt skoku", "pirackie trasy przelotowe", "burze jonowe", "strefa kwarantanny", "pole szczatkow po dawnej bitwie", "zaklocenia sensorow"),
                        2
                )) + "."),
                section("Punkty zainteresowania", String.join("; ", pickN(
                        List.of("opuszczona stacja paliwowa", "wrak znanego statku", "ukryta baza przemytnikow", "obcy artefakt na orbicie", "posterunek nasluchowy", "neutralna brama skoku", "platforma badawcza bez odpowiedzi"),
                        3
                )) + "."),
                section("Kontrola", pick(
                        "System formalnie należy do sojuszu kolonialnego, ale realnie rzadzi lokalna flota.",
                        "Kontrola jest sporna, a każda frakcja ma inne mapy prawne.",
                        "Korporacja posiada prawa wydobywcze, co w praktyce oznacza wladze.",
                        "System jest niekartowany; kazdy, kto tu przylatuje, sam definiuje prawo."
                )),
                section("Hak", "Najlepszy punkt wejscia to problem na skali systemu: zgubiony statek, blokada punktu skoku, konflikt o zasob albo sygnal z miejsca, którego nie ma na mapach.")
        );
    }

    private String planets(int count) {
        StringBuilder builder = new StringBuilder();
        for (int i = 1; i <= count; i++) {
            if (i > 1) builder.append("\n");
            builder.append(i).append(". ")
                    .append(pick("skalista", "pustynna", "oceaniczna", "lodowa", "gazowy olbrzym", "sztuczny habitat", "pas planetoid"))
                    .append(" - atmosfera: ")
                    .append(pick("oddychalna", "toksyczna", "cienka", "brak", "tylko kopuly mieszkalne"))
                    .append(", populacja: ")
                    .append(pick("brak", "automaty", "mała placowka", "kolonia", "duze miasta"))
                    .append(", zasob: ")
                    .append(pick("rudy metali", "lod paliwowy", "dane ruin", "biomasa", "nic oczywistego"));
        }
        return builder.toString();
    }

    private GeneratorOutputSection dungeonMapSection(DungeonMapData map) {
        return new GeneratorOutputSection("dungeon_map", "Mapa", map.gridText(), List.of(
                item("Legenda", "Ciemne: ściany, szare: korytarze, jasne: pokoje, cyfry: numery pokoi, E: wejście"),
                item("Pokoje", map.rooms().size())
        ));
    }

    private DungeonMapData dungeonMapData(String theme, int targetRooms, int width, int height, boolean linearPath) {
        int[][] grid = new int[height][width];
        boolean[][] blocked = new boolean[height][width];
        List<MapRoom> rooms = linearPath
                ? placeLinearRooms(grid, blocked, targetRooms, width, height)
                : placeRandomRooms(grid, blocked, targetRooms, width, height);

        rooms = orderedRooms(rooms, linearPath);
        if (linearPath) {
            for (int i = 1; i < rooms.size(); i++) {
                connectRooms(grid, blocked, rooms.get(i - 1), rooms.get(i));
            }
        } else {
            List<MapRoom> connected = new ArrayList<>();
            List<MapRoom> remaining = new ArrayList<>(rooms);
            if (!remaining.isEmpty()) {
                connected.add(remaining.remove(0));
            }
            while (!remaining.isEmpty()) {
                RoomPair pair = nearestRoomPair(connected, remaining);
                MapRoom from = pair.from();
                MapRoom to = pair.to();
                remaining.remove(to);
                connected.add(to);
                connectRooms(grid, blocked, from, to);
            }
        }
        for (MapRoom room : rooms) {
            grid[room.centerY()][room.centerX()] = 4 + room.id();
        }
        return new DungeonMapData(grid, rooms, theme);
    }

    private List<MapRoom> placeLinearRooms(int[][] grid, boolean[][] blocked, int targetRooms, int width, int height) {
        List<MapRoom> rooms = new ArrayList<>();
        boolean horizontal = width >= height;
        for (int index = 0; index < targetRooms; index++) {
            boolean placed = false;
            for (int attempt = 0; attempt < 80 && !placed; attempt++) {
                int roomWidth = pickInt(5, 5, 7);
                int roomHeight = pickInt(5, 5, 7);
                int x;
                int y;
                if (horizontal) {
                    int span = Math.max(1, width - roomWidth - 4);
                    int baseX = 1 + (targetRooms <= 1 ? 0 : index * span / (targetRooms - 1));
                    x = makeOdd(clamp(baseX + pickInt(-2, 0, 2), 1, width - roomWidth - 2), width);
                    y = randomOdd(1, height - roomHeight - 2);
                } else {
                    x = randomOdd(1, width - roomWidth - 2);
                    int span = Math.max(1, height - roomHeight - 4);
                    int baseY = 1 + (targetRooms <= 1 ? 0 : index * span / (targetRooms - 1));
                    y = makeOdd(clamp(baseY + pickInt(-2, 0, 2), 1, height - roomHeight - 2), height);
                }
                if (!overlaps(rooms, x, y, roomWidth, roomHeight)) {
                    addRoom(grid, blocked, rooms, x, y, roomWidth, roomHeight);
                    placed = true;
                }
            }
        }
        if (rooms.size() < targetRooms) {
            fillRandomRooms(grid, blocked, rooms, targetRooms, width, height);
        }
        return rooms;
    }

    private List<MapRoom> placeRandomRooms(int[][] grid, boolean[][] blocked, int targetRooms, int width, int height) {
        List<MapRoom> rooms = new ArrayList<>();
        fillRandomRooms(grid, blocked, rooms, targetRooms, width, height);
        return rooms;
    }

    private void fillRandomRooms(int[][] grid, boolean[][] blocked, List<MapRoom> rooms, int targetRooms, int width, int height) {
        for (int attempt = 0; attempt < 5000 && rooms.size() < targetRooms; attempt++) {
            int roomWidth = targetRooms > 8 ? 5 : pickInt(5, 7, 9);
            int roomHeight = targetRooms > 8 ? 5 : pickInt(5, 7);
            int x = randomOdd(1, width - roomWidth - 2);
            int y = randomOdd(1, height - roomHeight - 2);
            if (!overlaps(rooms, x, y, roomWidth, roomHeight)) {
                addRoom(grid, blocked, rooms, x, y, roomWidth, roomHeight);
            }
        }
        for (int y = 1; y <= height - 7 && rooms.size() < targetRooms; y += 2) {
            for (int x = 1; x <= width - 7 && rooms.size() < targetRooms; x += 2) {
                if (!overlaps(rooms, x, y, 5, 5)) {
                    addRoom(grid, blocked, rooms, x, y, 5, 5);
                }
            }
        }
    }

    private void addRoom(int[][] grid, boolean[][] blocked, List<MapRoom> rooms, int x, int y, int width, int height) {
        MapRoom room = new MapRoom(rooms.size() + 1, x, y, width, height);
        rooms.add(room);
        for (int yy = y; yy < y + height; yy++) {
            for (int xx = x; xx < x + width; xx++) {
                blocked[yy][xx] = true;
                grid[yy][xx] = 2;
            }
        }
    }

    private boolean overlaps(List<MapRoom> rooms, int x, int y, int width, int height) {
        return rooms.stream().anyMatch(room ->
                x <= room.x() + room.width() + 1
                        && x + width >= room.x() - 1
                        && y <= room.y() + room.height() + 1
                        && y + height >= room.y() - 1
        );
    }

    private int randomOdd(int min, int max) {
        int start = min % 2 == 0 ? min + 1 : min;
        int end = max % 2 == 0 ? max - 1 : max;
        if (end <= start) {
            return Math.max(1, start);
        }
        int slots = ((end - start) / 2) + 1;
        return start + (random.nextInt(slots) * 2);
    }

    private MapRoom nearestRoom(MapRoom from, List<MapRoom> rooms) {
        MapRoom nearest = rooms.get(0);
        int bestDistance = distance(from, nearest);
        for (MapRoom room : rooms) {
            int distance = distance(from, room);
            if (distance < bestDistance) {
                nearest = room;
                bestDistance = distance;
            }
        }
        return nearest;
    }

    private int distance(MapRoom left, MapRoom right) {
        return Math.abs(left.centerX() - right.centerX()) + Math.abs(left.centerY() - right.centerY());
    }

    private List<MapRoom> orderedRooms(List<MapRoom> rooms, boolean linearPath) {
        if (rooms.isEmpty()) {
            return rooms;
        }
        if (linearPath) {
            return spatialRoomOrder(rooms);
        }
        List<MapRoom> remaining = new ArrayList<>(rooms);
        MapRoom current = remaining.remove(0);
        List<MapRoom> ordered = new ArrayList<>();
        ordered.add(new MapRoom(1, current.x(), current.y(), current.width(), current.height()));
        while (!remaining.isEmpty()) {
            MapRoom next = nearestRoom(current, remaining);
            remaining.remove(next);
            current = next;
            ordered.add(new MapRoom(ordered.size() + 1, next.x(), next.y(), next.width(), next.height()));
        }
        return ordered;
    }

    private List<MapRoom> spatialRoomOrder(List<MapRoom> rooms) {
        int minX = rooms.stream().mapToInt(MapRoom::centerX).min().orElse(0);
        int maxX = rooms.stream().mapToInt(MapRoom::centerX).max().orElse(0);
        int minY = rooms.stream().mapToInt(MapRoom::centerY).min().orElse(0);
        int maxY = rooms.stream().mapToInt(MapRoom::centerY).max().orElse(0);
        boolean horizontal = (maxX - minX) >= (maxY - minY);

        List<MapRoom> sorted = new ArrayList<>(rooms);
        sorted.sort((left, right) -> {
            int primary = horizontal
                    ? Integer.compare(left.centerX(), right.centerX())
                    : Integer.compare(left.centerY(), right.centerY());
            if (primary != 0) {
                return primary;
            }
            return horizontal
                    ? Integer.compare(left.centerY(), right.centerY())
                    : Integer.compare(left.centerX(), right.centerX());
        });

        List<MapRoom> ordered = new ArrayList<>();
        for (MapRoom room : sorted) {
            ordered.add(new MapRoom(ordered.size() + 1, room.x(), room.y(), room.width(), room.height()));
        }
        return ordered;
    }

    private RoomPair nearestRoomPair(List<MapRoom> connected, List<MapRoom> remaining) {
        RoomPair best = new RoomPair(connected.get(0), remaining.get(0));
        int bestDistance = distance(best.from(), best.to());
        for (MapRoom from : connected) {
            for (MapRoom to : remaining) {
                int distance = distance(from, to);
                if (distance < bestDistance) {
                    best = new RoomPair(from, to);
                    bestDistance = distance;
                }
            }
        }
        return best;
    }

    private void connectRooms(int[][] grid, boolean[][] blocked, MapRoom from, MapRoom to) {
        DoorPoint start = doorToward(from, to);
        DoorPoint end = doorToward(to, from);
        carveCorridor(grid, blocked, start.x(), start.y(), end.x(), end.y());
    }

    private void carveCorridor(int[][] grid, boolean[][] blocked, int startX, int startY, int endX, int endY) {
        List<int[]> path = corridorPath(grid, blocked, startX, startY, endX, endY);
        if (path.isEmpty()) {
            path = forcedCorridorPath(startX, startY, endX, endY);
        }
        for (int[] point : path) {
            int x = point[0];
            int y = point[1];
            if (inBounds(grid, x, y) && grid[y][x] == 0) {
                grid[y][x] = 1;
            }
        }
    }

    private List<int[]> corridorPath(int[][] grid, boolean[][] blocked, int startX, int startY, int endX, int endY) {
        List<List<int[]>> candidates = new ArrayList<>();
        addRouteCandidate(candidates, point(startX, startY), point(endX, startY), point(endX, endY));
        addRouteCandidate(candidates, point(startX, startY), point(startX, endY), point(endX, endY));

        for (int midX : corridorMidpoints(startX, endX, grid[0].length)) {
            addRouteCandidate(candidates, point(startX, startY), point(midX, startY), point(midX, endY), point(endX, endY));
        }
        for (int midY : corridorMidpoints(startY, endY, grid.length)) {
            addRouteCandidate(candidates, point(startX, startY), point(startX, midY), point(endX, midY), point(endX, endY));
        }

        List<int[]> best = List.of();
        int bestScore = Integer.MAX_VALUE;
        for (List<int[]> candidate : candidates) {
            int score = corridorScore(grid, blocked, candidate);
            if (score < bestScore) {
                best = candidate;
                bestScore = score;
            }
        }
        if (bestScore < 100_000) {
            return best;
        }
        return breadthFirstCorridorPath(grid, blocked, startX, startY, endX, endY);
    }

    private void addRouteCandidate(List<List<int[]>> candidates, int[]... anchors) {
        List<int[]> route = new ArrayList<>();
        for (int i = 1; i < anchors.length; i++) {
            int[] from = anchors[i - 1];
            int[] to = anchors[i];
            int x = from[0];
            int y = from[1];
            if (route.isEmpty()) {
                route.add(point(x, y));
            }
            while (x != to[0]) {
                x += Integer.compare(to[0], x);
                route.add(point(x, y));
            }
            while (y != to[1]) {
                y += Integer.compare(to[1], y);
                route.add(point(x, y));
            }
        }
        candidates.add(route);
    }

    private int[] point(int x, int y) {
        return new int[]{x, y};
    }

    private List<Integer> corridorMidpoints(int start, int end, int limit) {
        List<Integer> points = new ArrayList<>();
        int mid = makeOdd((start + end) / 2, limit);
        points.add(mid);
        for (int offset : List.of(-6, -4, -2, 2, 4, 6)) {
            int candidate = makeOdd(mid + offset, limit);
            if (!points.contains(candidate)) {
                points.add(candidate);
            }
        }
        return points;
    }

    private int makeOdd(int value, int limit) {
        int clamped = clamp(value, 1, Math.max(1, limit - 2));
        if (clamped % 2 == 0) {
            clamped = clamped + 1 < limit - 1 ? clamped + 1 : clamped - 1;
        }
        return Math.max(1, clamped);
    }

    private int corridorScore(int[][] grid, boolean[][] blocked, List<int[]> path) {
        int score = path.size();
        int lastDx = 0;
        int lastDy = 0;
        for (int i = 0; i < path.size(); i++) {
            int[] point = path.get(i);
            int x = point[0];
            int y = point[1];
            if (!inBounds(grid, x, y)) {
                return Integer.MAX_VALUE;
            }
            boolean endpoint = i == 0 || i == path.size() - 1;
            if (blocked[y][x] && !endpoint) {
                return 100_000 + path.size();
            }
            if ((grid[y][x] == 2 || grid[y][x] >= 5) && !endpoint) {
                return 100_000 + path.size();
            }
            if (grid[y][x] == 1) {
                score -= 3;
            }
            if (i > 0) {
                int[] previous = path.get(i - 1);
                int dx = Integer.compare(x, previous[0]);
                int dy = Integer.compare(y, previous[1]);
                if (lastDx != 0 || lastDy != 0) {
                    if (dx != lastDx || dy != lastDy) {
                        score += 8;
                    }
                }
                lastDx = dx;
                lastDy = dy;
            }
        }
        return score;
    }

    private List<int[]> forcedCorridorPath(int startX, int startY, int endX, int endY) {
        List<int[]> route = new ArrayList<>();
        int x = startX;
        int y = startY;
        route.add(point(x, y));
        if (random.nextBoolean()) {
            while (x != endX) {
                x += Integer.compare(endX, x);
                route.add(point(x, y));
            }
            while (y != endY) {
                y += Integer.compare(endY, y);
                route.add(point(x, y));
            }
        } else {
            while (y != endY) {
                y += Integer.compare(endY, y);
                route.add(point(x, y));
            }
            while (x != endX) {
                x += Integer.compare(endX, x);
                route.add(point(x, y));
            }
        }
        return route;
    }

    private List<int[]> breadthFirstCorridorPath(int[][] grid, boolean[][] blocked, int startX, int startY, int endX, int endY) {
        if (!inBounds(grid, startX, startY) || !inBounds(grid, endX, endY)) {
            return List.of();
        }
        int height = grid.length;
        int width = grid[0].length;
        boolean[][] visited = new boolean[height][width];
        int[][] previousX = new int[height][width];
        int[][] previousY = new int[height][width];
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                previousX[y][x] = -1;
                previousY[y][x] = -1;
            }
        }

        java.util.ArrayDeque<int[]> queue = new java.util.ArrayDeque<>();
        queue.add(new int[]{startX, startY});
        visited[startY][startX] = true;
        int[][] directions = shuffledDirections();

        while (!queue.isEmpty()) {
            int[] current = queue.removeFirst();
            if (current[0] == endX && current[1] == endY) {
                break;
            }
            for (int[] direction : directions) {
                int nx = current[0] + direction[0];
                int ny = current[1] + direction[1];
                if (!inBounds(grid, nx, ny) || visited[ny][nx] || blocked[ny][nx]) {
                    continue;
                }
                visited[ny][nx] = true;
                previousX[ny][nx] = current[0];
                previousY[ny][nx] = current[1];
                queue.addLast(new int[]{nx, ny});
            }
        }

        if (!visited[endY][endX]) {
            return List.of();
        }
        List<int[]> path = new ArrayList<>();
        int x = endX;
        int y = endY;
        while (!(x == startX && y == startY)) {
            path.add(new int[]{x, y});
            int px = previousX[y][x];
            int py = previousY[y][x];
            x = px;
            y = py;
        }
        path.add(new int[]{startX, startY});
        return path;
    }

    private int[][] shuffledDirections() {
        List<int[]> directions = new ArrayList<>(List.of(
                new int[]{1, 0},
                new int[]{-1, 0},
                new int[]{0, 1},
                new int[]{0, -1}
        ));
        java.util.Collections.shuffle(directions, random);
        return directions.toArray(new int[0][]);
    }

    private DoorPoint doorToward(MapRoom room, MapRoom target) {
        int dx = target.centerX() - room.centerX();
        int dy = target.centerY() - room.centerY();
        if (Math.abs(dx) >= Math.abs(dy)) {
            int x = dx >= 0 ? room.x() + room.width() - 1 : room.x();
            int outsideX = dx >= 0 ? room.x() + room.width() : room.x() - 1;
            int y = clamp(target.centerY(), room.y(), room.y() + room.height() - 1);
            return new DoorPoint(x, y, outsideX, y);
        }
        int x = clamp(target.centerX(), room.x(), room.x() + room.width() - 1);
        int y = dy >= 0 ? room.y() + room.height() - 1 : room.y();
        int outsideY = dy >= 0 ? room.y() + room.height() : room.y() - 1;
        return new DoorPoint(x, y, x, outsideY);
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private void hCorridor(int[][] grid, boolean[][] blocked, int x1, int x2, int y) {
        int start = Math.min(x1, x2);
        int end = Math.max(x1, x2);
        for (int x = start; x <= end; x++) {
            if (inBounds(grid, x, y) && !blocked[y][x] && grid[y][x] == 0) {
                grid[y][x] = 1;
            }
        }
    }

    private void vCorridor(int[][] grid, boolean[][] blocked, int y1, int y2, int x) {
        int start = Math.min(y1, y2);
        int end = Math.max(y1, y2);
        for (int y = start; y <= end; y++) {
            if (inBounds(grid, x, y) && !blocked[y][x] && grid[y][x] == 0) {
                grid[y][x] = 1;
            }
        }
    }

    private boolean inBounds(int[][] grid, int x, int y) {
        return y >= 0 && y < grid.length && x >= 0 && x < grid[y].length;
    }

    private GeneratorOutputSection stats(String category, String extraLabel, Object extraValue) {
        return new GeneratorOutputSection("stats", "Podsumowanie", null, List.of(
                item("Kategoria", category),
                item("Wariant", "Ogólny opisowy"),
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

    private String title(String code) {
        return title(code, Map.of());
    }

    private String title(String code, Map<String, Object> params) {
        if ("five_room_dungeon".equals(code)) {
            String setting = dungeonSetting(params);
            return dungeonTitle(setting, dungeonTheme(params, setting));
        }
        return switch (code) {
            case "calendar_fantasy" -> pick("Kalendarz Dziesieciu Ogni", "Rok Cichego Księżyca", "Rachuba Starych Drog");
            case "demographics_fantasy" -> pick("Brzeziny", "Kamienny Brod", "Ostatni Targ", "Nadbrzezna Straznica");
            case "castle_fantasy" -> pick("Zamek Czarny Most", "Twierdza Nad Mgla", "Warownia Trzech Bram", "Forteca Srebrnego Progu");
            case "dungeon_advanced" -> pick("Wielki Kompleks pod Bramą", "Podziemią Trzech Poziomów", "Labirynt Starego Rdzenia", "Twierdza pod Ziemią");
            case "coc_investigator_npc" -> pick("Helena Ward", "Marek Voss", "Oskar Feld", "Irena Koss", "Tomasz Armitage");
            case "scifi_world" -> pick("Hespera IX", "Nowy Ostrow", "Lima-7", "Port Kallisto", "Vega Dolna");
            case "star_system" -> pick("System Kallisto", "Vega Minor", "Proxima Drift", "Tau Cerber", "Epsilon Latarnia");
            default -> pick("Aethoria", "Valdris", "Kaerath", "Nemoria", "Durnell");
        };
    }

    private String dungeonTitle(String setting, String theme) {
        String settingKey = normalize(setting);
        if (settingKey.contains("horror")) {
            return pick("Piwnice Bez Głosu", "Kostnica pod Starą Ulicą", "Dom za Czarnym Lasem", "Stacja Ostatniego Pociągu");
        }
        if (settingKey.contains("sci-fi")) {
            return pick("Wrak Helios-9", "Moduł Ciszy", "Stacja Kallisto Cień", "Laboratorium Sekcji Zero");
        }
        if (settingKey.contains("postapo")) {
            return pick("Schron Pod Martwą Tamą", "Metro Ostatniego Kursu", "Baza Filtr-7", "Magazyn Czystej Wody");
        }
        if (settingKey.contains("realistyczny")) {
            return pick("Podziemią Starego Fortu", "Magazyn przy Nabrzeżu", "Tunel pod Kamienicą", "Archiwum Bez Okien");
        }
        return switch (normalize(theme)) {
            case "krypta", "katakumby" -> pick("Krypta Bez Dzwonu", "Katakumby Srebrnych Kości", "Grobowiec Pod Mokrym Murem");
            case "kopalnia", "ruiny krasnoludzkie" -> pick("Kopalnia Czarnej Żyły", "Chodniki pod Złamanym Szczytem", "Ruiny Klanu Orem");
            case "świątynia", "sanktuarium kultu" -> pick("Sanktuarium Złamanej Przysięgi", "Świątynia Trzeciego Dzwonu", "Podziemie Białego Ołtarza");
            case "wieża maga", "magiczne laboratorium" -> pick("Wieża pod Ziemią", "Laboratorium Bez Cienia", "Pracownia Pękniętej Gwiazdy");
            case "kryjówka bandytów", "stara kanalizacja" -> pick("Kryjówka pod Młynem", "Kanały Czarnego Targu", "Pięć Komór Szarej Bandy");
            default -> pick("Pięciokomorowy Loch pod Młynem", "Loch Starej Pieczęci", "Podziemie Cichej Bramy");
        };
    }

    private String label(String code) {
        return switch (code) {
            case "calendar_fantasy" -> "Kalendarz fantasy";
            case "demographics_fantasy" -> "Demografia średniowieczna";
            case "castle_fantasy" -> "Zamek fantasy";
            case "five_room_dungeon" -> "Loch";
            case "dungeon_advanced" -> "Loch zaawansowany";
            case "coc_investigator_npc" -> "NPC grozy sledczej";
            case "scifi_world" -> "Świat sci-fi";
            case "star_system" -> "System gwiezdny";
            default -> "Świat fantasy";
        };
    }

    private String category(String code) {
        if (FANTASY.contains(code)) return "FANTASY";
        if (HORROR.contains(code)) return "HORROR";
        return "SCIFI";
    }

    private String subtitleCategory(String code, Map<String, Object> params) {
        if ("five_room_dungeon".equals(code) || "dungeon_advanced".equals(code)) {
            return dungeonSetting(params);
        }
        return category(code);
    }

    private String occupation(String group) {
        return switch (group) {
            case "Sledczy", "Śledczy" -> pick("prywatny detektyw", "policjant", "dziennikarz");
            case "Uczony" -> pick("profesor", "lekarz", "archeolog", "bibliotekarz");
            case "Elita" -> pick("prawnik", "kolekcjoner", "dziedzic fortuny", "artystka z dobrego domu");
            case "Mistyk" -> pick("okultysta", "medium", "badacz snow", "kolekcjoner zakazanych ksiazek");
            case "Twardziel" -> pick("byly żołnierz", "bokser", "marynarz", "ochroniarz");
            default -> pick("sekretarz", "sklepikarz", "naucżyciel", "pielegniarka", "kierowca");
        };
    }

    private int populationFor(String size) {
        return switch (size) {
            case "Przysiolek" -> 30 + random.nextInt(70);
            case "Wies" -> 150 + random.nextInt(350);
            case "Miasteczko" -> 800 + random.nextInt(2200);
            case "Miasto" -> 5000 + random.nextInt(15000);
            case "Metropolia" -> 25000 + random.nextInt(75000);
            default -> populationFor(pick("Przysiolek", "Wies", "Miasteczko", "Miasto"));
        };
    }

    private String sizeLabel(String size) {
        return isRandom(size) ? "osada o niejednoznacznym statusie" : size.toLowerCase();
    }

    private int planetCount(Map<String, Object> params) {
        String value = stringParam(params, "planetCount", "Losowa");
        if (!isRandom(value)) {
            try {
                return Math.max(2, Math.min(6, Integer.parseInt(value)));
            } catch (NumberFormatException ignored) {
            }
        }
        return 2 + random.nextInt(5);
    }

    private int intParam(Map<String, Object> params, String key, int fallback, int min, int max) {
        Object value = params.get(key);
        if (value == null || String.valueOf(value).isBlank() || isRandom(String.valueOf(value))) {
            return fallback;
        }
        try {
            return Math.max(min, Math.min(max, Integer.parseInt(String.valueOf(value))));
        } catch (NumberFormatException ignored) {
            return fallback;
        }
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean isRandom(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase();
        return normalized.isBlank() || normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String pick(String... values) {
        return values[random.nextInt(values.length)];
    }

    private String pick(List<String> values) {
        return values.get(random.nextInt(values.size()));
    }

    private int pickInt(int... values) {
        return values[random.nextInt(values.length)];
    }

    private <T> List<T> pickN(List<T> values, int count) {
        java.util.ArrayList<T> copy = new java.util.ArrayList<>(values);
        java.util.Collections.shuffle(copy, random);
        return copy.subList(0, Math.min(count, copy.size()));
    }

    private record FantasyWorldFrame(String identity, String geography, String conflict, String powerCenter) {
    }

    private record MapRoom(int id, int x, int y, int width, int height) {
        private int centerX() {
            return x + width / 2;
        }

        private int centerY() {
            return y + height / 2;
        }
    }

    private record RoomPair(MapRoom from, MapRoom to) {
    }

    private record DoorPoint(int x, int y, int outsideX, int outsideY) {
    }

    private record DungeonMapData(int[][] grid, List<MapRoom> rooms, String theme) {
        private String gridText() {
            StringBuilder builder = new StringBuilder();
            for (int y = 0; y < grid.length; y++) {
                if (y > 0) {
                    builder.append('\n');
                }
                for (int x = 0; x < grid[y].length; x++) {
                    builder.append(tileSymbol(grid[y][x]));
                }
            }
            return builder.toString();
        }

        private char tileSymbol(int tile) {
            if (tile == -1) {
                return 'e';
            }
            if (tile == -2) {
                return 'u';
            }
            if (tile == -3) {
                return 'v';
            }
            if (tile >= 5) {
                int roomNumber = tile - 4;
                if (roomNumber >= 1 && roomNumber <= 26) {
                    return (char) ('A' + roomNumber - 1);
                }
            }
            return Character.forDigit(tile, 10);
        }
    }

    private record DungeonRoom(int number, String description) {
    }

    private record DungeonFrame(
            String atmosphere,
            String goal,
            String threat,
            String entrance,
            String challenge,
            String twist,
            String climax,
            String reward
    ) {
    }
}

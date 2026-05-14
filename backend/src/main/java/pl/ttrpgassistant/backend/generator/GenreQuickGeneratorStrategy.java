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
public class GenreQuickGeneratorStrategy implements GeneratorStrategy {
    private static final Set<String> HORROR = Set.of(
            "npc_horror", "clue", "cult_horror", "horror_creature",
            "suspect", "witness", "victim", "investigation_location",
            "ritual", "artifact_horror", "omen", "horror_document", "horror_escalation"
    );
    private static final Set<String> POSTAPO = Set.of(
            "survivor", "shelter", "supply_run", "zombie_variant",
            "survivor_group", "supplies", "postapo_location", "horde",
            "postapo_conflict", "moral_dilemma", "postapo_event", "disease_contamination", "vehicle_wreck"
    );
    private static final Set<String> SCIFI = Set.of(
            "npc_scifi", "planet", "space_station", "anomaly",
            "starship", "colony", "corporation", "scifi_mission",
            "alien_organism", "technology", "cyberware", "system_failure", "ship_threat"
    );

    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return (HORROR.contains(generatorCode) && "horror.quick".equals(variantCode))
                || (POSTAPO.contains(generatorCode) && "postapo.quick".equals(variantCode))
                || (SCIFI.contains(generatorCode) && "scifi.quick".equals(variantCode))
                || ("npc_horror".equals(generatorCode) && "coc7e.quick".equals(variantCode));
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        return generate("npc_horror", "horror.quick", request);
    }

    @Override
    public GeneratorStructuredResultResponse generate(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        if ("npc_horror".equals(generatorCode) && "coc7e.quick".equals(variantCode)) {
            return generateCocNpc(params);
        }
        String category = "clue".equals(generatorCode) ? clueSetting(params) : category(generatorCode);
        String tone = stringParam(params, "tone", defaultTone(category));
        String system = stringParam(params, "system", "system_agnostic");
        String title = titleFor(generatorCode);

        return new GeneratorStructuredResultResponse(
                null,
                generatorCode,
                variantCode,
                title,
                subtitleFor(generatorCode, category, tone),
                sectionsFor(generatorCode, params, category, tone, system, title),
                "seed",
                OffsetDateTime.now()
        );
    }

    private GeneratorStructuredResultResponse generateCocNpc(Map<String, Object> params) {
        int str = roll3d6();
        int con = roll3d6();
        int siz = roll2d6plus6();
        int dex = roll3d6();
        int app = roll3d6();
        int intel = roll2d6plus6();
        int pow = roll3d6();
        int edu = Math.min(99, roll2d6plus6() + 3);

        int san = pow * 5;
        int hp  = (con + siz) / 10;
        int mp  = pow / 5;
        int luck = roll3d6() * 5;
        int move = (dex > siz) ? 8 : (dex < siz ? 6 : 7);
        String dmgBonus = calcDmgBonus(str + siz);

        String role = stringParam(params, "role", "Losowy");
        String occupation = pickOccupation(role);
        String tone = stringParam(params, "tone", "investigation_horror");
        String name = cocNpcName();

        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(new GeneratorOutputSection("characteristics", "Charakterystyki", null, List.of(
                item("STR", str), item("CON", con), item("SIZ", siz), item("DEX", dex),
                item("APP", app), item("INT", intel), item("POW", pow), item("EDU", edu),
                item("SAN", san), item("HP", hp), item("MP", mp),
                item("Szczescie", luck), item("Ruch", move), item("Bonus obrażeń", dmgBonus)
        )));
        sections.add(section("Zawod", occupation + " — " + occupationContext(occupation)));
        sections.add(section("Umiejetnosci", buildSkills(occupation, edu)));
        sections.add(section("Wyglad i zachowanie", name + ": " + pick(
                "sprawia wrazenie normalnosci. Jeden szczegol nie pasuje do reszty.",
                "ubiera sie starannie, mowi malo i slucha za duzo.",
                "jest nerwowy bez powodu, ktory chce podac.",
                "robi wszystko, zeby nie wychodzic poza swoja rutyne. Cos ja rozerwalo.",
                "zadaje pytania zanim odpowiada. Zawsze."
        )));
        sections.add(section("Historia", pick(
                "Pracuje tu od lat. Wie wiecej niz mowi — i nie wie ze wie za duzo.",
                "Przeniosl sie tu niedawno. Uciekl przed czyms, co zdaje sie go dogonic.",
                "Mieszka tu od urodzenia. Zna kazdy zakatek i prawie kazdy sekret.",
                "Mial wyjechac. Zostal z powodu, ktorego juz nie pamietа wyraznie.",
                "Przyjaciel spromowal go do miasta. Przyjaciel zniknal pol roku pozniej."
        )));
        sections.add(section("Dylemat", pick(
                "Lojalnosc wobec kogos, kto nie zasluguje — ale zna prawde.",
                "Widzial cos, czego nie potrafi wytlumaczyc. To go stopniowo niszczy.",
                "Ma wiedze, ktora moze kosztowac zycie — swoje albo cudze.",
                "Pomogł ukryc cos wiele lat temu i zyl dobrze. Az do teraz.",
                "Chce zrobic cos wlasciwego, ale nie wie co jest wlasciwe."
        )));
        sections.add(section("Hak do sledztwa", pick(
                "Zna dojscie do miejsca, do ktorego gracze nie moga dotrzec inaczej.",
                "Byl ostatnia osoba, ktora widziala ofiare zywa — jeszcze o tym nie wie.",
                "Nosi przy sobie cos, co zmienia wszystko — nie wie co to jest.",
                "Kontakt z kims waznym — ale tego kontaktu nie ujawni bez powodu.",
                "Prowadzil wlasne sledztwo. Zatrzymal sie w momencie, gdy zrobilo sie niebezpiecznie."
        )));

        return new GeneratorStructuredResultResponse(
                null, "npc_horror", "coc7e.quick", name,
                "NPC CoC 7E — HORROR — " + displayTone(tone),
                sections, "seed", OffsetDateTime.now()
        );
    }

    private int roll3d6() {
        return random.nextInt(6) + 1 + random.nextInt(6) + 1 + random.nextInt(6) + 1;
    }

    private int roll2d6plus6() {
        return random.nextInt(6) + 1 + random.nextInt(6) + 1 + 6;
    }

    private String calcDmgBonus(int total) {
        if (total <= 12) return "-1k6";
        if (total <= 16) return "-1k4";
        if (total <= 24) return "Brak";
        if (total <= 32) return "+1k4";
        return "+1k6";
    }

    private String pickOccupation(String role) {
        return switch (role) {
            case "Sledczy"  -> pick("Prywatny detektyw", "Dziennikarz", "Policjant", "Oficer");
            case "Uczony"   -> pick("Profesor", "Lekarz", "Archeolog", "Psycholog", "Historyk");
            case "Elita"    -> pick("Prawnik", "Polityk", "Dyletatnt", "Pisarz", "Artysta");
            case "Mistyk"   -> pick("Okultysta", "Medium", "Wrozbiarz", "Kolekcjoner arkanow");
            case "Twardziel"-> pick("Zolnierz", "Bokser", "Marynarz", "Kryminalista");
            default         -> pick("Bibliotekarz", "Nauczyciel", "Pielęgniarka", "Sklepikarz",
                                    "Mechanik", "Sekretarka", "Kierowca", "Dziennikarz");
        };
    }

    private String occupationContext(String occupation) {
        return switch (occupation) {
            case "Prywatny detektyw" -> "pracuje na wlasny rachunek, zna ludzi ktorych inni wola nie znac";
            case "Dziennikarz"       -> "wie za duzo i publikuje za malo";
            case "Policjant"         -> "sluzy lokalnej spolecznosci, ale cena jest wysoka";
            case "Oficer"            -> "widzial wojne i cos jeszcze — i to cos go odnalazlo";
            case "Profesor",
                 "Historyk"          -> "akademik, ktory widzial cos podwazajacego jego metodologie";
            case "Lekarz"            -> "zna tajemnice pacjentow — nie zawsze to jest wygodne";
            case "Archeolog"         -> "wrocil z wyprawy z czyms, czego nie powinien byl brac";
            case "Psycholog"         -> "bada umysly i wie, ze niektore rzeczy widac tylko z zewnatrz";
            case "Okultysta",
                 "Medium",
                 "Wrozbiarz",
                 "Kolekcjoner arkanow" -> "dziala na granicy tego, co inni uznaja za szarlatanerie";
            case "Zolnierz",
                 "Bokser",
                 "Marynarz"          -> "widzial przemoc i nauczyl sie z nia zyc — z mieszanym skutkiem";
            case "Kryminalista"      -> "zna zasady gry, w ktora reszta nie wie ze gra";
            case "Prawnik"           -> "reprezentuje klientow, z ktorych jeden jest wiecej niz jednym";
            default                  -> "prowadzi normalne zycie — az do momentu gdy gracze sie pojawiaja";
        };
    }

    private String buildSkills(String occupation, int edu) {
        int high = Math.min(90, 50 + random.nextInt(25));
        int mid  = Math.min(85, 30 + random.nextInt(20));
        int low  = Math.min(75, 15 + random.nextInt(20));
        int lib  = Math.min(85, 20 + (edu / 10) * 5);
        int psy  = Math.min(80, 10 + random.nextInt(35));
        int spot = Math.min(80, 25 + random.nextInt(30));

        String[] skills = switch (occupation) {
            case "Prywatny detektyw" -> new String[]{
                "Prawo " + high + "%", "Psychologia " + (mid + 10) + "%",
                "Ukrywanie " + mid + "%", "Sledzenie " + mid + "%",
                "Biblioteka " + lib + "%", "Dostrzezenie " + spot + "%"
            };
            case "Dziennikarz" -> new String[]{
                "Biblioteka " + (lib + 15) + "%", "Jezyki obce " + mid + "%",
                "Psychologia " + psy + "%", "Fotografia " + high + "%",
                "Dostrzezenie " + spot + "%", "Przekonywanie " + mid + "%"
            };
            case "Policjant" -> new String[]{
                "Prawo " + mid + "%", "Strzelanie " + high + "%",
                "Sledzenie " + mid + "%", "Jezda " + (30 + random.nextInt(20)) + "%",
                "Pierwsza pomoc " + low + "%", "Dostrzezenie " + spot + "%"
            };
            case "Oficer" -> new String[]{
                "Strzelanie " + high + "%", "Walka " + mid + "%",
                "Nawigacja " + low + "%", "Pierwsza pomoc " + mid + "%",
                "Przywodztwo " + mid + "%", "Sledzenie " + low + "%"
            };
            case "Profesor", "Historyk" -> new String[]{
                "Biblioteka " + (lib + 20) + "%", "Jezyki obce " + high + "%",
                "Historia " + high + "%", "Archeologia " + mid + "%",
                "Psychologia " + psy + "%", "Nauka " + mid + "%"
            };
            case "Lekarz" -> new String[]{
                "Medycyna " + high + "%", "Pierwsza pomoc " + (high + 10) + "%",
                "Biologia " + (mid + 10) + "%", "Biblioteka " + lib + "%",
                "Psychologia " + psy + "%", "Dostrzezenie " + spot + "%"
            };
            case "Archeolog" -> new String[]{
                "Archeologia " + high + "%", "Historia " + mid + "%",
                "Biblioteka " + (lib + 10) + "%", "Jezyki obce " + mid + "%",
                "Wspinaczka " + low + "%", "Dostrzezenie " + spot + "%"
            };
            case "Psycholog" -> new String[]{
                "Psychologia " + high + "%", "Medycyna " + mid + "%",
                "Biblioteka " + lib + "%", "Perswazja " + (mid + 10) + "%",
                "Dostrzezenie " + spot + "%", "Jezyki obce " + low + "%"
            };
            case "Okultysta", "Medium", "Wrozbiarz", "Kolekcjoner arkanow" -> new String[]{
                "Okultyzm " + high + "%", "Historia " + mid + "%",
                "Biblioteka " + (lib + 10) + "%", "Jezyki obce " + mid + "%",
                "Psychologia " + psy + "%", "Perswazja " + mid + "%"
            };
            case "Zolnierz", "Bokser", "Marynarz" -> new String[]{
                "Walka " + high + "%", "Strzelanie " + mid + "%",
                "Pierwsza pomoc " + mid + "%", "Atletyka " + (mid + 10) + "%",
                "Nawigacja " + low + "%", "Sledzenie " + low + "%"
            };
            case "Kryminalista" -> new String[]{
                "Wlamywanie " + high + "%", "Ukrywanie " + (mid + 10) + "%",
                "Walka " + mid + "%", "Sledzenie " + mid + "%",
                "Przekonywanie " + psy + "%", "Dostrzezenie " + spot + "%"
            };
            case "Prawnik" -> new String[]{
                "Prawo " + high + "%", "Perswazja " + (mid + 10) + "%",
                "Biblioteka " + lib + "%", "Psychologia " + psy + "%",
                "Historia " + low + "%", "Jezyki obce " + low + "%"
            };
            default -> new String[]{
                "Pierwsza pomoc " + mid + "%", "Jezda " + mid + "%",
                "Dostrzezenie " + spot + "%", "Sluchanie " + (20 + random.nextInt(30)) + "%",
                "Biblioteka " + lib + "%", "Mechanika " + low + "%"
            };
        };
        return String.join(", ", skills);
    }

    private String cocNpcName() {
        String[] names = {
            "Edmund Voss", "Michal Dorn", "Stefan Wren", "Henryk Baur",
            "Tadeusz Holm", "Oskar Feld", "Aleksander Kray",
            "Zofia Maler", "Irena Koss", "Helena Nort",
            "Marta Dorn", "Elzbieta Haas", "Jadwiga Stein", "Anna Veld"
        };
        return names[random.nextInt(names.length)];
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
                    section("Typ", resolveClueType(params) + " | " + category),
                    section("Opis", clueDescription(category, title)),
                    section("Co sugeruje", clueImplication(category)),
                    section("Zwodniczy detal", clueFalseLead(category))
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
            case "suspect" -> List.of(
                    stats(category, tone, system, "Poziom winy", stringParam(params, "guiltLevel", "Losowy")),
                    section("Imie i tlo", title + " jest znany w okolicy. Jego alibi brzmi wiarygodnie, dopoki ktos nie sprawdzi szczegolów."),
                    section("Alibi", pick("Byl widziany przez jednego swiadka — ktory ma powod klamic.", "Dokumenty sie zgadzaja, ale jeden zapis jest zbyt czysty.", "Nikt nie pamietam go tamtej nocy, a on twierdzi ze byl wszedzie.")),
                    section("Motyw", pick("Pieniadze, ktore mial stracic.", "Tajemnica, ktora ofiara odkryla.", "Stara uraza, o ktorej oficjalnie nikt nie wiedzial.")),
                    section("Podejrzane zachowanie", pick("Za szybko zaproponowal pomoc sledczym.", "Unika jednej konkretnej lokacji.", "Zna detale, o ktorych nie powinien wiedziec.")),
                    section("Prawda", "Moze byc winny, wspolnik albo swiadkiem, ktory ma wlasny powod milczec. Postaw graczy przed decyzja, zanim dasz pewnosc."),
                    section("Trop dalej", "Podejrzany wie cos wiecej niz mowi. Prawdziwe pytanie to nie czy klamal, tylko dlaczego.")
            );
            case "witness" -> List.of(
                    stats(category, tone, system, "Stan psychiczny", stringParam(params, "mentalState", "Wstrzasniety")),
                    section("Kim jest", title + " byl we wlasciwym miejscu o zlej porze. Teraz nie jest pewien, czy to co widzial bylo prawdziwe."),
                    section("Co twierdzi ze widzial", pick("Sylwetke, ktora nie rzucala cienia.", "Kogos, kto oficjalnie nie zyje.", "Wydarzenie niemozliwe wedlug wszystkich znanych zasad.")),
                    section("Czego nie mowi", pick("Zna sprawce, ale sie boi.", "Sam mial w tym udzial — bierny, ale jednak.", "To co widzial przeczy jego wlasnym przekonaniom i wolalby zapomniec.")),
                    section("Sprzecznosc w zeznaniu", pick("Godziny sie nie zgadzaja z innymi swiadkami.", "Opis miejsca nie pasuje do tego, co tam rzeczywiscie jest.", "Kilka slow to dosłowny cytat z dokumentu, do ktorego nie powinien miec dostepu.")),
                    section("Jak go przekonac", "Swiadek przemówi, jesli poczuje sie bezpieczniej niz ze swoim milczeniem. Albo jesli ktos udowodni, ze i tak juz wiedzial za duzo.")
            );
            case "victim" -> List.of(
                    stats(category, tone, system, "Stan ofiary", stringParam(params, "victimState", "Znaleziona")),
                    section("Kim byla", title + " prowadziła normalne zycie — lub to co za takie uchodzilo. Jeden element nie pasuje do reszty."),
                    section("Ostatnie znane dzialania", pick("Umowila sie z kims, kogo nie wymieniala z imienia.", "Wypłacila duza sume gotowki bez wytlumaczenia.", "Zostawila wiadomosc, ktora brzmi inaczej po fakcie.")),
                    section("Slady", pick("Brak sladow walki, ale tez brak osobistych rzeczy.", "Ktos wyczyScil jedno konkretne miejsce zbyt dokladnie.", "Przedmiot, ktory nie nalezy do ofiary i nie nalezy do nikogo w poblizu.")),
                    section("Sekret ofiary", pick("Wiedzila o sprawie wczesniej niz ktokolwiek inny.", "Sama zaczela sledztwo, ktore nie dotarło do zadnej instytucji.", "Miala kontakt z osoba, ktora teraz twierdzi ze jej nie znala.")),
                    section("Co jej los mowi o zagrozeniu", "Ofiara nie byla przypadkowa. Wybor mowi cos o tym, kto i dlaczego.")
            );
            case "investigation_location" -> List.of(
                    stats(category, tone, system, "Typ lokacji", stringParam(params, "locationType", "Losowa")),
                    section("Opis", title + " wyglada normalnie na pierwszy rzut oka. Jeden szczegol niszczy to wrazenie, jesli ktos stanie w odpowiednim miejscu."),
                    section("Co wida na pierwszy rzut oka", pick("Porządek zbyt staranny jak na opuszczone miejsce.", "Niedziałający sprzet, ktory wlaczono niedawno.", "Zapach, ktory nie pasuje do tego pomieszczenia.")),
                    section("Ukryty trop", pick("Dokument za lustra.", "Slad biologiczny pod powierzchowna warstwa.", "Dwa rozne systemy ryglowania, zainstalowane w roznych epokach.")),
                    section("Falszywy trop", "W lokacji jest cos, co wyglada jak dowod, ale prowadzi do kogoś niewinnego. Gracze moga to odkryc, jesli nie pojda na skroty."),
                    section("Zagrozenie", pick("Ktos obserwuje lokacje i wróci sprawdzic, czy zostala przeszukana.", "Miejsce jest niestabilne — fizycznie albo prawnie.", "Prawdziwy sprawca zostawil tu pulapke informacyjna."))
            );
            case "ritual" -> List.of(
                    stats(category, tone, system, "Etap rytualu", stringParam(params, "ritualStage", "W trakcie")),
                    section("Nazwa i cel", title + " to rytual, ktory istnial przed wszystkimi pamietajacymi go. Jego cel jest prostszy niz opisuja teksty."),
                    section("Wymagania", pick("Konkretne miejsce, konkretna godzina, konkretna osoba.", "Ofiarowanie czegos, czego nie mozna odkupic.", "Obecnosc osoby, ktora nie wie ze uczestniczy.")),
                    section("Przebieg", "Etap: " + stringParam(params, "ritualStage", "W trakcie") + ". " + pick("Rytual przebiega przez trzy noce — gracze sa na drugiej.", "Kazdy etap pozostawia fizyczny slad widoczny z zewnatrz.", "Uczestnicy nie rozumieja co robie — tylko lider zna calosc.")),
                    section("Objawy w okolicy", pick("Zwierzeta zachowuja sie nienaturalnie w promieniu polowy mili.", "Sny okolicznych mieszkancow zawieraja ten sam fragment.", "Zjawiska atmosferyczne nie zgadzaja sie z prognoza.")),
                    section("Jak go przerwac", "Przerwanie ma cene. Jesli gracze nie wiedza jaka, popelnia wiecej bledow niz gdyby nie przerywali.")
            );
            case "artifact_horror" -> List.of(
                    stats(category, tone, system, "Typ artefaktu", stringParam(params, "artifactType", "Losowy")),
                    section("Wyglad", title + " nie wyglada na niebezpieczny. To jest czesc problemu."),
                    section("Historia", pick("Zmienial wlascicieli w regularnych odstepach czasu — zawsze w wyniku wypadku.", "Zostal stworzony dla konkretnego celu, ktory ktos uznal za rozwiazanie.", "Nikt nie wie, kto go zrobil. Dokumenty sie nie zgadzaja.")),
                    section("Efekt", "Typ: " + stringParam(params, "artifactType", "Losowy") + ". " + pick("Zmienia percepcje rzeczy zwiazanych ze smiercia.", "Pozwala slyszec to, co powiedziano w tym miejscu dawno temu.", "Daje wiedze, za ktora pobiera cene pozniej.")),
                    section("Koszt uzywania", pick("Uzytkownik zaczyna wiedziec rzeczy, ktorych nie powinien.", "Przedmiot zaznacza uzytkownika dla czegos, co teraz go szuka.", "Kazde uzycie zostawia trwaly slad w osobowosci.")),
                    section("Kto go szuka", "Ktos juz wie, ze artefakt zmienil wlasciciela. Niekoniecznie przyjdzie po niego od razu.")
            );
            case "omen" -> List.of(
                    stats(category, tone, system, "Typ omenu", stringParam(params, "omenType", "Losowy")),
                    section("Zjawisko", title + " zaczyna sie subtelnie. Do momentu, gdy ktos go identyfikuje jako omen, jest juz pozno."),
                    section("Kiedy wystepuje", pick("Trzy razy przed wydarzeniem, w malejacych odstepach.", "Tylko wtedy, gdy ktos z grupy jest sam.", "W miejscach zwiazanych z konkretna osoba lub decyzja.")),
                    section("Co zapowiada", pick("Smierc osoby, ktora omen widziala.", "Przebudzenie czegos, co bylo zwiazane.", "Moment, po ktorym cofniecie bedzie niemozliwe.")),
                    section("Jak reaguje otoczenie", pick("Zwierzeta unikaja miejsca, w ktorym omen wystapil.", "Osoby, ktore nie widzialy omenu, czuja niepokój bez powodu.", "Jeden czlonek grupy nie moze spac.")),
                    section("Jak go odsunac", "Omen mozna zignorować. Skutki ignorowania sa czescia fabuły.")
            );
            case "horror_document" -> List.of(
                    stats(category, tone, system, "Typ dokumentu", stringParam(params, "documentType", "Losowy")),
                    section("Tresc", title + " wyglada oficjalnie. Dopiero trzecia lektura pokazuje, co jest nie tak."),
                    section("Autor", pick("Osoba, ktora oficjalnie nie miala dostepu do tych informacji.", "Ktos, kto w dacie dokumentu byl juz martwy.", "Autor bez nazwy — tylko inicjaly i numer, ktory nic nie znaczy dla graczy na razie.")),
                    section("Ukryty sens", pick("Informacje sa prawdziwe, ale selektywnie dobrane.", "Jeden fakt jest falszywy — celowo.", "Dokument jest kodem dla kogoś, kto wie jak czytac.")),
                    section("Trop", pick("Strona jest wyrwana — i ktos to zaplanował.", "Marginesy zawieraja adnotacje innym charakterem pisma.", "Numeracja stron ma brakujacy fragment.")),
                    section("Niepokojacy szczegol", "Jeden element dokumentu jest niemozliwy. Gracze moga go zauwazyc lub nie — obie opcje maja konsekwencje.")
            );
            case "horror_escalation" -> List.of(
                    stats(category, tone, system, "Etap horroru", stringParam(params, "stage", "Srodkowy")),
                    section("Co sie zmienia", "Etap: " + stringParam(params, "stage", "Srodkowy") + ". " + pick("Zjawiska, ktore mozna bylo tlumaczyc inaczej, teraz nie daja sie tlumaczyc.", "Ktos z lokalnej spolecznosci wiedzial od poczatku — i milczal.", "Reguly zmieniaja sie bez zapowiedzi.")),
                    section("Jak reaguje otoczenie", pick("Mieszkancy zamykaja sie i przestaja pytac o pomoc.", "Instytucje przestaja dzialac jak powinny.", "Osoby, ktore mialy pomoc, staja sie czescia problemu.")),
                    section("Co widza gracze", pick("Skutki bez przyczyny.", "Przyczyne bez mozliwosci dzialan.", "Decyzje z ceną, ktora pojawia sie pozniej.")),
                    section("Co stanie sie pozniej", pick("Skala rosnie, zasiag sie rozszerza.", "Okno mozliwosci zamknie sie w konkretnym momencie.", "Ktos straci cos nieodwracalnego, jesli gracze nie zadziałaja.")),
                    section("Jak przerwac eskalacje", "Zatrzymanie wymaga wiedzy, ktora gracze jeszcze nie maja — ale moga miec, jesli zadaja wlasciwych pytan.")
            );
            case "survivor_group" -> List.of(
                    stats(category, tone, system, "Typ grupy", stringParam(params, "groupType", "Losowa")),
                    section("Nazwa i skład", title + " liczba od kilku do kilkunastu osob. Trzymaja sie razem z potrzeby, nie z wyboru."),
                    section("Lider", pick("Ktos, kto przejal dowodzenie w kryzysie i nigdy nie oddal wladzy.", "Wybierany rotacyjnie — co powoduje wiecej tarć niz powinno.", "Lider nominalny i lider faktyczny — i obie osoby wiedza o tym.")),
                    section("Zasady grupy", pick("Proste i egzekwowane surowo bez wyjatkow.", "Elastyczne, co oznacza ze sa nagiete przez tych z wplywami.", "Nieformalnie jedno: nie pytaj o to, co bylo przed grupą.")),
                    section("Zasoby", pick("Podstawowe zapasy na tydzien, brak marginesu bezpieczenstwa.", "Wiecej niz pokazuja — co budzi nieufnosc u nowych.", "Jedno unikalne zasoby, ktory wszystkich uzaleznia od jednej osoby.")),
                    section("Problem i konflikt", "Wewnetrzne napiecie jest gorsze niz zewnetrzne zagrozenie. Gracze wchodza w moment, gdy cos sie wlasnie zalamuje.")
            );
            case "supplies" -> List.of(
                    stats(category, tone, system, "Typ zasobow", stringParam(params, "supplyType", "Losowy")),
                    section("Co znaleziono", title + ". Wiekszosc jest w stanie uzywalnym, ale jeden element jest problematyczny."),
                    section("Ilosc", pick("Wystarczy na tydzien dla grupy — jesli nie bedzie strat.", "Mniej niz wyglada z zewnatrz.", "Wiecej niz potrzeba — co znaczy, ze ktos to zostawil celowo.")),
                    section("Problem z zasobem", pick("Zapas jest czesciowo skazony albo uszkodzony.", "Etykiety nie zgadzaja sie z zawartoscia.", "Ktos dal znak posiadania wlasnosci — nowy albo swiezy.")),
                    section("Kto jeszcze ich chce", pick("Inna grupa monitoruje te lokacje regularnie.", "Wlasciciel wróci — kwestia czasu.", "Ktos sledzil graczy od momentu, gdy zaczeli szukac.")),
                    section("Hak", "Zasoby moga byc uzywane albo wymieniane. Wymiana otwiera kontakty, ktore maja wlasne oczekiwania.")
            );
            case "postapo_location" -> List.of(
                    stats(category, tone, system, "Typ lokacji", stringParam(params, "locationType", "Losowa")),
                    section("Opis", title + " bylo kiedys normalne. Teraz jest niebezpieczne z powodow, ktore sa czytelne dla kogoś uważnego."),
                    section("Co zostalo", pick("Struktura stoi, ale kazdy krok moze byc ostatni.", "Kilka pomieszczen jest nadal uzytecznych, reszta jest pulapką.", "Miejsce zostalo czesciowo sprzatniete przez kogos kto byl tu niedawno.")),
                    section("Zagrozenie", pick("Fizyczne: niestabilna konstrukcja z nieprzewidywalnymi miejscami.", "Biologiczne: slady zarazenia lub kolonii.", "Ludzkie: ktos traktuje to miejsce jako wlasnosc.")),
                    section("Ukryty zasob", pick("Magazyn za niewidocznym zejsciem.", "Generator, ktory moze jeszcze dzialac.", "Przedmioty zostawione przez ostatnich uzytkownikow z konkretnymi informacjami.")),
                    section("Slad po dawnych mieszkancach", "Jeden szczegol mowi wiecej o tym co sie stalo niz cale miejsce razem wziate.")
            );
            case "horde" -> List.of(
                    stats(category, tone, system, "Rozmiar hordy", stringParam(params, "size", "Srednia")),
                    section("Opis", title + " porusza sie w kierunku, ktory za kilka godzin stanie sie problemem grupy."),
                    section("Co ja przyciaga", pick("Dzwiek agregatu, ktory ktos uruchomil.", "Sygnal termiczny z schronienia.", "Jeden czlonek grupy zostawil slad wychodzac po zasoby.")),
                    section("Jak zmienia sytuacje", pick("Blokuje glowna droge powrotu.", "Zmusza do wyboru: obrona schronienia albo opuszczenie go.", "Daje godzine — moze dwie — na decyzje.")),
                    section("Mozliwe rozwiazania", pick("Odciagnac przez sygnaly dalej.", "Przepuscic przez wlasna pozycje z minimalnymi stratami.", "Przetrzymac i dac sie omysc.")),
                    section("Scena", "Horda nie jest plotkama. Pokaz jeden element — halas, kurz, zapach — zanim stanie sie widoczna.")
            );
            case "postapo_conflict" -> List.of(
                    stats(category, tone, system, "Typ konfliktu", stringParam(params, "conflictType", "Losowy")),
                    section("Strony konfliktu", title + " — dwie strony, z ktorych zadna nie ma racji w calosci."),
                    section("Powod", pick("Kontrola nad zasobem, bez ktorego obie strony przezyja krocej.", "Stara uraza sprzed upadku, ktora nie zostala rozwiazana.", "Idealogiczne roznice, ktore sa tak naprawde o strachu.")),
                    section("Kto ma racje", "Obie strony maja czesc racji. Gracze dostana pelna informacje dopiero po rozmowie z obiema stronami."),
                    section("Co grozi eskalacja", pick("Jednorazowy wypad staje sie recydywa.", "Trzecia strona czeka na oslabionych zwyciezce.", "Jedna decyzja jednej strony wymknie sie spod kontroli.")),
                    section("Mozliwe rozwiazania", "Rozwiazanie, ktore zadowoli obie strony, istnieje — ale wymaga czegos od kazdej z nich. Gracze moga byc mediatorami albo istotnymi elementami rozwiazania.")
            );
            case "moral_dilemma" -> List.of(
                    stats(category, tone, system, "Waga decyzji", stringParam(params, "decisionWeight", "Grupowa")),
                    section("Sytuacja", title + " wymaga decyzji, ktorej nie da sie odroczyc i nie da sie cofnac."),
                    section("Opcja A", pick("Ocalic wiekszosc kosztem jednej osoby, ktora na to nie zasluzyła.", "Zrealizowac plan grupy kosztem czegos, w co sie wierzyz.", "Ujawnic prawde, co nieodwracalnie cos zniszczy.")),
                    section("Opcja B", pick("Nie podejmowac dzialania — co tez jest decyzja ze skutkami.", "Dac szanse wszystkim kosztem wiekszego ryzyka dla wszystkich.", "Ukryc prawde, zeby uchronic kogos kto moze byc winny.")),
                    section("Koszt kazdej decyzji", "Koszt opcji A jest natychmiastowy i widoczny. Koszt opcji B odlozony w czasie — i wiekszy."),
                    section("Konsekwencje pozniej", "Decyzja pozostaje z graczami. Nie jako mechanika — jako czesc historii, ktora inni pamietaja.")
            );
            case "postapo_event" -> List.of(
                    stats(category, tone, system, "Typ wydarzenia", stringParam(params, "eventType", "Losowe")),
                    section("Wydarzenie", title + " zmienia sytuacje grupy natychmiast. Nie bylo w planie."),
                    section("Natychmiastowy problem", pick("Wymaga zasobu, ktorego wlasnie brakuje.", "Dzieli grupe w najgorszym mozliwym momencie.", "Zmienia priorytety w sposob, ktory koliduje ze wszystkim.")),
                    section("Okazja", pick("Moze dac dostep do czegos, czego szukali.", "Tworzy okno czasowe na akcje, ktora wczesniej byla niemozliwa.", "Pokazuje informacje o wrogach albo sojusznikach.")),
                    section("Konsekwencja", "Wydarzenie zmienia stan swiata o jeden krok. Decyzje podjete teraz maja skutki w nastepnej sesji.")
            );
            case "disease_contamination" -> List.of(
                    stats(category, tone, system, "Powaznosc", stringParam(params, "severity", "Srednia")),
                    section("Objawy", title + " nie jest natychmiast oczywista. Pierwsze objawy mozna wytlumaczyc inaczej."),
                    section("Zrodlo", pick("Woda ze zbiornika, ktory wydawal sie czysty.", "Kontakt z osoba, ktora nie wiedzial ze jest nosicielem.", "Miejsce, ktore wszyscy omijali — poza jednym czlonkiem grupy.")),
                    section("Jak wykryc", pick("Jeden objaw jest charakterystyczny dla konkretnego zagrozenia.", "Testy daja wynik po 24 godzinach — za pozno na preewencje.", "Ktos w grupie widzial to wczesniej i rozpoznaje.")),
                    section("Jak spowolnic", pick("Izolacja nosiciela — co wprowadza napiecie grupowe.", "Zasoby medyczne, ktorych nie ma w obozie.", "Wiedza o zrodle, zanim zrodlo sie rozszerzy.")),
                    section("Konsekwencje", "Powaznosc: " + stringParam(params, "severity", "Srednia") + ". Nieleczona zmienia sklad grupy. Leczona kosztuje zasob i czas, ktorych tez brakuje.")
            );
            case "vehicle_wreck" -> List.of(
                    stats(category, tone, system, "Typ pojazdu", stringParam(params, "vehicleType", "Losowy")),
                    section("Opis", title + " stoi na poboczu od dawna. Ktos juz byl tu przed graczami."),
                    section("Co dziala", pick("Silnik moze odpalić po kilku godzinach pracy.", "Bak jest pusty, ale zbiornik awaryjny ma resztki.", "Klatka jest nienaruszona — moze sluzyc jako schronienie.")),
                    section("Co jest uszkodzone", pick("Podwozie po kolizji z czymś ciezkim.", "Szyby i zamki — ktos wlazł z sila.", "System elektryczny, ktory decyduje o wielu innych elementach.")),
                    section("Co mozna znalezc", pick("Mapy albo dokumenty pozostawione przez poprzedniego wlasciciela.", "Ekwipunek, ktory nie nalezy do standardowego pojazdu tego typu.", "Rzeczy osobiste, ktore mówia wiecej niz powinnny.")),
                    section("Kto moze po niego przyjsc", "Pojazd jest zaznaczony na czyjejs mapie. Czas jest po stronie tego, kto moze czekac.")
            );
            case "starship" -> List.of(
                    stats(category, tone, system, "Typ statku", stringParam(params, "shipType", "Losowy")),
                    section("Nazwa i klasa", title + " ma historii wiecej niz dokumentacja mowi."),
                    section("Wyglad", pick("Zewnetrznie sprawny, wewnetrznie zdekapitalizowany.", "Modyfikacje, ktore nie sa w rejestrze i nie pasuja do siebie.", "Slady napraw w miejscach, gdzie oficjalnie nie bylo nic do naprawy.")),
                    section("Problem techniczny", pick("Jeden system klamie w raportach i nikt nie wie od kiedy.", "Naped ma okienko niesprawnosci w regularnych odstepach.", "Kamera w jednym module zostala celowo wylaczona.")),
                    section("Ladune i zaloga", pick("Cargo jest zarejestrowane jako inne niz faktycznie.", "Jeden czlonek zalogi ma odrebny kontrakt nieznany reszcie.", "Ktos na pokladzie czeka na konkretne wspolrzedne.")),
                    section("Sekret", "Najwazniejsza informacja o statku nie ma dokumentacji. Ktos zadbał o to celowo.")
            );
            case "colony" -> List.of(
                    stats(category, tone, system, "Typ kolonii", stringParam(params, "colonyType", "Losowa")),
                    section("Nazwa i polozenie", title + " istnieje na granicy tego, co centralna administracja uznaje za stabilne."),
                    section("Zarzadca", pick("Wydajny, ale zbyt lojalny wobec korporacji.", "Charismatyczny, ale opodal prawo tam gdzie potrzeba.", "Slaby — faktyczna wladza lezy gdzie indziej.")),
                    section("Zasoby", pick("Jeden glowny zasob i nic wiecej — co tworzy zaleznosc.", "Samwystarczalnosc prawie osiagnieta, brakuje jednej czesci.", "Zasoby sa, ale dostep kontroluje jedna osoba.")),
                    section("Konflikt", pick("Koloniści vs kontrakt — warunki nie sa tym, co obiecywano.", "Wewnetrzny podzial miedzy dwiema frakcjami z nierownymi zasobami.", "Lokalne odkrycie zmienilo priorytety wszystkich.")),
                    section("Zagrozenie", "Zewnetrzne zagrozenie istnieje — ale kolonia jest zbyt zajeata konfliktem wewnetrznym, zeby sie nim zajac.")
            );
            case "corporation" -> List.of(
                    stats(category, tone, system, "Branza", stringParam(params, "industry", "Losowa")),
                    section("Nazwa i produkt", title + " dziala oficjalnie i legalnie. Wszystko inne jest kwestia definicji."),
                    section("Logo i slogan", pick("Czysty, profesjonalny branding skrywajacy procesy, o ktorych klienci nie chca wiedziec.", "Rozpoznawalny symbol z historia, ktora firma aktywnie przepisuje.", "Minimalistyczny — bo nie ma co ukrywac temu, kto patrzy obok logika.")),
                    section("Metody", "Branza: " + stringParam(params, "industry", "Losowa") + ". " + pick("Dziala przez subkontrakty, wiec zadna decyzja nie ma jednego autora.", "Kupuje problemy zanim stana sie publiczne.", "Produkuje zaleznosc zanim klienci wiedza ze sa zalezni.")),
                    section("Sekret", pick("Jeden projekt, ktory nigdy nie zostal oficjalnie zamkniety.", "Ktos z zarzadu ma umowe z inna korporacja.", "Dane sa sprzedawane — klientom i o klientach jednoczesnie.")),
                    section("Wrog", "Korporacja ma konkretnego wroga. Czy sa to gracze, czy inna korporacja — zalezy od kontekstu.")
            );
            case "scifi_mission" -> List.of(
                    stats(category, tone, system, "Typ misji", stringParam(params, "missionType", "Losowa")),
                    section("Zleceniodawca", title + " ma cel jasny na papierze. Cel faktyczny jest zaznaczony mniejszym drukiem."),
                    section("Cel", pick("Odzysk artefaktu, ktory oficjalnie nie byl tam zostawiony.", "Ochrona osoby, ktora oficjalnie nie potrzebuje ochrony.", "Misja rozpoznawcza z parametrami, ktore sugeruja akcje.")),
                    section("Lokacja", pick("Stacja, ktora miała byc opuszczona.", "Planeta z anomalia w danych nawigacyjnych.", "Wrak na szlaku, ktory jest zbyt regularnie oczyszczany.")),
                    section("Komplikacja", pick("Cel misji jest juz tam, gdzie druzyna ma pojechac — i nie chce wspolpracy.", "Inna druzyna ma ten sam zlecenie i inne instrukcje co do wspólpracy.", "Zleceniodawca zmienia parametry w trakcie.")),
                    section("Nagroda", "Nagroda jest realna. Pytanie czy zleceniodawca jest lojalny tak samo jak nagroda jest realna.")
            );
            case "alien_organism" -> List.of(
                    stats(category, tone, system, "Agresywnosc", stringParam(params, "aggression", "Terytorialna")),
                    section("Nazwa i wyglad", title + " nie pasuje do zadnej znane taksonomii. Jeden element wyglada znajomo, reszta nie."),
                    section("Cykl zycia", pick("Fazy sa czytelne, ale przejscia miedzy nimi sa nieprzewidywalne.", "Reprodukuje sie szybciej niz skanery moga rejestrowac.", "Latencja przed aktywacja sprawiia, ze jest za pozno na reakcje.")),
                    section("Zachowanie", pick("Terytorialne: markuje obszar i reaguje na naruszenie.", "Adaptacyjne: zmienia metody po pierwszym nieudanym kontakcie.", "Pasozytniczne: szuka nosiciela, nie wroga.")),
                    section("Zagrozenie", "Agresywnosc: " + stringParam(params, "aggression", "Terytorialna") + ". " + pick("Bezposrednie: fizyczne zagrozenie przy kontakcie.", "Posrednie: zmienia srodowisko, zanim stanie sie problemem.", "Niewidoczne: aktywuje cos innego.")),
                    section("Slabosc", "Slabosc istnieje i moze byc odkryta. Wymaga obserwacji, nie pierwszego ataku.")
            );
            case "technology" -> List.of(
                    stats(category, tone, system, "Typ technologii", stringParam(params, "technologyType", "Losowy")),
                    section("Nazwa i wyglad", title + " jest bardziej zaawansowana niz powinna byc w tym miejscu i czasie."),
                    section("Funkcja", pick("Robi dokladnie to co jest w specyfikacji, plus jedno co nie jest.", "Dziala z marginesem bledow, ktory nie powinien byc akceptowalny.", "Wymaga wiedzy, ktora nie jest w dostarczonej dokumentacji.")),
                    section("Wada", pick("Uzywanie zostawia dane u producenta.", "Jedno wejscie jest niezabezpieczone w sposob, ktory wyglada na celowy.", "Limitowanie zywotnoci — po n uzycich wymaga serwisu u autoryzowanego serwisanta.")),
                    section("Kto jej szuka", pick("Producent chce ja odzysc i nie pytac dlaczego jest poza kanałem.", "Konkurencja chce wzor, nie egzemplarz.", "Jeden uzytkownik zna zbyt wiele o tym, jak naprawde dziala.")),
                    section("Hak", "Technologia moze rozwiazac problem grupy. Ale skad pochodzi i kto za nia placil to pytania, ktore wróca.")
            );
            case "cyberware" -> List.of(
                    stats(category, tone, system, "Jakosc", stringParam(params, "quality", "Przemyslowy")),
                    section("Nazwa i funkcja", title + " daje wymierna przewage. Cena jest inaczej opisana niz w ofercie."),
                    section("Efekt uboczny", pick("Zmiany neurologiczne widoczne dopiero po tygodniach uzytkowania.", "Sygnatura biologiczna rozpoznawalna przez systemy monitorujace.", "Uzaleznienie od serwisu, ktory ma jeden autoryzowany punkt.")),
                    section("Producent", pick("Firma, ktora oficjalnie nie produkuje tego modelu.", "Zrodlo nieznane — ale jakosc sugeruje zasoby wieksze niz rynek szary.", "Modyfikacja wojskowego standartu przez kogoś kto wiedzial co robi.")),
                    section("Nielegalna modyfikacja", "Jakosc: " + stringParam(params, "quality", "Przemyslowy") + ". " + pick("Zablokowane fabryczne limity wydajnosci.", "Dodatkowy modul komunikacyjny bez dokumentacji.", "Usuniete zabezpieczenia, ktore istnialy z konkretnego powodu.")),
                    section("Hak", "Ktos, kto widzial ten model, bedzie mial pytania. Albo oferte.")
            );
            case "system_failure" -> List.of(
                    stats(category, tone, system, "Dotkniety system", stringParam(params, "affectedSystem", "Losowy")),
                    section("Awaria", title + " przestaje dzialac w momencie, gdy jest najbardziej potrzebny."),
                    section("Objawy", pick("Raporty wskazuja normalny stan, ale efekty sa nieoczekiwane.", "Jeden czujnik jest wylaczony — jedyny, ktory mialby ostrzec.", "System dziala z 20% wydajnoscia i nikt nie zauwazył kiedy to sie zaczelo.")),
                    section("Konsekwencje", "System: " + stringParam(params, "affectedSystem", "Losowy") + ". " + pick("Kaskadowy wpływ na zalezne systemy.", "Okno bezpieczenstwa dla czegos z zewnatrz.", "Jedna osoba na pokladzie wiedzial ze to nastapi.")),
                    section("Jak naprawic", pick("Wymaga czesci, ktore sa, ale nie przy awarii.", "Procedura jest w dokumentacji — na zdalnym serwerze, ktory nie odpowiada.", "Naprawa wymaga wylaczenia drugiego systemu.")),
                    section("Co przeszkadza", "Naprawa jest mozliwa. Czas, w ktorym trzeba to zrobic przy innych aktywnych zagrozeniach, nie jest.")
            );
            case "ship_threat" -> List.of(
                    stats(category, tone, system, "Typ zagrozenia", stringParam(params, "threatType", "Losowy")),
                    section("Zagrozenie", title + " zaczyna sie od sygnalu, ktory mozna zignorowac raz."),
                    section("Pierwsze oznaki", pick("Jeden czlonek zalogi zachowuje sie inaczej bez widocznego powodu.", "Poziomy energii w jednym module odchylaja sie od normy.", "Lacznosc zewnetrzna ma opoznienie, ktore nie istnialo wczesniej.")),
                    section("Kto wie", pick("Jeden czlonek zalogi wiedzial wczesniej i czeka z informacja.", "System AI zarejestrowal anomalie ale nie eskalowala alertu.", "Ktos na zewnatrz zdaje sobie sprawe z zagrozenia i nie poinformowal zalogi.")),
                    section("Co stanie sie pozniej", pick("Zagrozenie rosnie liniowo az do punktu krytycznego.", "Jedno zdarzenie zmieni charakter zagrozenia.", "Zagrozenie moze sie cofnac, jesli nikt nie zadziala.")),
                    section("Mozliwe rozwiazanie", "Typ: " + stringParam(params, "threatType", "Losowy") + ". " + pick("Wymaga wiedzy, ktora jest na pokladzie, ale nie w jednym miejscu.", "Wymaga decyzji, ktora ma rownoprawne argumenty za i przeciw.", "Mozna rozwiazac bez strat, jesli ktos ma odwage podjac niepopularna decyzje."))
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
            case "suspect" -> pick("Aldric Venn", "Siostra Marta Koss", "Inspektor bez akt");
            case "witness" -> pick("Tomasz Wrel", "Pani z Pierwszego Pietra", "Chlopiec, Ktory Nie Spi");
            case "victim" -> pick("Elara Moss", "Nieznany z Dokiem", "Marek spod Trójki");
            case "investigation_location" -> pick("Piwnica przy Czarnej Ulicy", "Archiwum bez Sygnatury", "Dom, Ktory Zmienil Wlasciciela");
            case "ritual" -> pick("Rytuał Trzeciej Nocy", "Krąg Zapomnianej Przysiegi", "Obrzed Bez Nazwy");
            case "artifact_horror" -> pick("Ksiega z Pustymi Stronami", "Medal bez Herbu", "Pudelko, Ktore Gra");
            case "omen" -> pick("Trzy Czarne Ptaki", "Zegar Ktory Staje", "Dziecko Ktore Pyta");
            case "horror_document" -> pick("Raport bez Paginacji", "List Bez Daty", "Notatka Marginesowa");
            case "horror_escalation" -> pick("Noc Drugiego Dnia", "Moment Gdy Zrozumieli", "Godzina Bez Powrotu");
            case "survivor_group" -> pick("Reszta z Dwunastki", "Bastion Numer Siedem", "Wolni z Autostrad");
            case "supplies" -> pick("Skrzynka z Apteki", "Zapasy z Magazynu B", "Znalezisko spod Huty");
            case "postapo_location" -> pick("Rynek Bez Dachu", "Szkola za Wiaduktem", "Sortownia przy Rzece");
            case "horde" -> pick("Szary Potok z Pólnocy", "Fala z Dzielnicy Przemyslowej", "Cichy Tlum z Autostrady");
            case "postapo_conflict" -> pick("Spor o Most Centralny", "Kwestia Studni", "Granica przy Torach");
            case "moral_dilemma" -> pick("Jeden za Wielu", "Prawda albo Spokoj", "Ocal Jednego");
            case "postapo_event" -> pick("Sygnal z Poludnia", "Nieoczekiwany Deszcz", "Pojazd bez Druzyny");
            case "disease_contamination" -> pick("Kaszel z Sektora B", "Goraczka bez Przyczyny", "Skazenie Wodociagow");
            case "vehicle_wreck" -> pick("Ciezarowka przy Zjezdzie", "Bus Szkolny Bez Kol", "Woz Bojowy z Otwartymi Drzwiami");
            case "starship" -> pick("ISV Corveaux", "Marginal Run", "Niezarejestrowany Pol-Zero");
            case "colony" -> pick("Nowy Ostrow", "Stacja Dolna Hespera", "Kolonia 7 Listopada");
            case "corporation" -> pick("Vantage Systems", "Nexodyne Corp", "Bledna Linia Badawcza");
            case "scifi_mission" -> pick("Zlecenie z Baza Lima", "Kontrakt Bez Sygnatury", "Operacja Cicha Punkt");
            case "alien_organism" -> pick("Forma bez Nazwy", "Nosiciel Trzeciego Szczebla", "Obiekt Biologiczny Zero-Cztery");
            case "technology" -> pick("Prototyp bez Serii", "Modul Nieznanych Specyfikacji", "Urzadzenie Przed Rynkiem");
            case "cyberware" -> pick("Wzmocnienie Serii V", "Interfejs bez Certyfikatu", "Nielegalny Modul Sensoryczny");
            case "system_failure" -> pick("Awaria Podsystemu Alfa", "Blad Rdzenia Nawigacyjnego", "Utrata Kontroli Sektora C");
            case "ship_threat" -> pick("Nieznany Sygnal na Pokladzie", "Zagrozenie Wewnatrz Modulu Trzeciego", "Problem z Membrana Kadluba");
            default -> pick("Pekniecie Delta", "Echo spoza Mapy", "Anomalia Czarny Sygnet");
        };
    }

    private String labelFor(String code) {
        return switch (code) {
            case "npc_horror" -> "NPC horror";
            case "clue" -> "Wskazowka";
            case "cult_horror" -> "Kult horror";
            case "horror_creature" -> "Istota horror";
            case "survivor" -> "Ocalaly";
            case "shelter" -> "Schronienie";
            case "supply_run" -> "Wyprawa po zasoby";
            case "zombie_variant" -> "Wariant zombie";
            case "npc_scifi" -> "NPC sci-fi";
            case "planet" -> "Planeta";
            case "space_station" -> "Stacja kosmiczna";
            case "suspect" -> "Podejrzany";
            case "witness" -> "Swiadek";
            case "victim" -> "Ofiara";
            case "investigation_location" -> "Miejsce sledztwa";
            case "ritual" -> "Rytual";
            case "artifact_horror" -> "Artefakt horror";
            case "omen" -> "Omen";
            case "horror_document" -> "Dokument horror";
            case "horror_escalation" -> "Eskalacja horroru";
            case "survivor_group" -> "Grupa ocalalych";
            case "supplies" -> "Zapasy";
            case "postapo_location" -> "Lokacja postapo";
            case "horde" -> "Horda";
            case "postapo_conflict" -> "Konflikt postapo";
            case "moral_dilemma" -> "Dylemat moralny";
            case "postapo_event" -> "Wydarzenie postapo";
            case "disease_contamination" -> "Choroba / skazenie";
            case "vehicle_wreck" -> "Wrak pojazdu";
            case "starship" -> "Statek kosmiczny";
            case "colony" -> "Kolonia";
            case "corporation" -> "Korporacja";
            case "scifi_mission" -> "Misja sci-fi";
            case "alien_organism" -> "Obcy organizm";
            case "technology" -> "Technologia";
            case "cyberware" -> "Cyberwzmocnienie";
            case "system_failure" -> "Awaria systemu";
            case "ship_threat" -> "Zagrozenie na statek";
            default -> "Anomalia";
        };
    }

    private String subtitleFor(String code, String category, String tone) {
        if ("clue".equals(code)) {
            return "Wskazówka - " + category;
        }
        return labelFor(code) + " - " + category + " - " + displayTone(tone);
    }

    private String clueSetting(Map<String, Object> params) {
        String requested = stringParam(params, "setting", "Horror");
        if (isRandom(requested)) {
            return pick("Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny");
        }
        return requested;
    }

    private String resolveClueType(Map<String, Object> params) {
        String requested = stringParam(params, "clueType", "Losowy");
        if (!isRandom(requested)) {
            return requested;
        }
        return pick("Ślad fizyczny", "Dokument", "Relacja świadka", "Nagranie", "Symbol", "Brakujący element", "Mapa", "Log systemowy", "Rzecz osobista", "Niepasujący zapach", "Uszkodzony nośnik", "Znak ostrzegawczy");
    }

    private String clueDescription(String setting, String title) {
        return switch (settingKey(setting)) {
            case "fantasy" -> title + " wygląda jak drobiazg z codziennego życia, ale nosi znak zakazanej umowy.";
            case "sci-fi", "scifi" -> title + " ma metadane, które nie pasują do czasu ani miejsca zdarzenia.";
            case "postapo" -> title + " jest zużyte, naprawiane i zostawione tam, gdzie nikt nie powinien być.";
            case "realistyczny" -> title + " jest zwykłym dowodem, tylko jeden szczegół przeczy oficjalnej wersji.";
            default -> title + " wygląda niewinnie, ale nie pasuje do oficjalnej wersji wydarzeń.";
        };
    }

    private String clueImplication(String setting) {
        return switch (settingKey(setting)) {
            case "fantasy" -> pick("ktoś z lokalnych zna stary symbol", "magiczna przysięga nadal działa", "winny miał dostęp do miejsca przez sojusznika", "relikwia zmieniła właściciela bez świadków", "lokalny herb został użyty niezgodnie z prawem");
            case "sci-fi", "scifi" -> pick("logi zostały poprawione po fakcie", "AI pominęła ważny alert", "ktoś był na pokładzie bez wpisu w rejestrze", "dane przyszły z miejsca, które oficjalnie milczy", "czujnik widział człowieka bez sygnatury biologicznej");
            case "postapo" -> pick("zasób zabrano przed atakiem", "napastnicy znali trasę patrolu", "ktoś wewnątrz osady pomógł obcym", "mapa została celowo przerobiona", "ślad prowadzi do starego sojusznika");
            case "realistyczny" -> pick("świadek zna ofiarę lepiej niż twierdzi", "sprawca miał legalny dostęp", "motyw jest bliżej domu niż wygląda", "ktoś usunął tylko jeden fragment nagrania", "najważniejszy dowód był cały czas na widoku");
            default -> pick("sprawca znał ofiarę", "rytuał zaczął się wcześniej niż wszyscy myślą", "świadek kłamie z dobrego powodu", "dowód wskazuje bardziej na ukrywanie niż atak", "ktoś próbuje skierować śledztwo na łatwego winnego");
        };
    }

    private String clueFalseLead(String setting) {
        return switch (settingKey(setting)) {
            case "fantasy" -> "Pierwszy wniosek wskazuje potwora albo klątwę, ale prawdziwy trop prowadzi do ludzi.";
            case "sci-fi", "scifi" -> "Błąd systemu wygląda naturalnie, dopóki gracze nie sprawdzą kto go zatwierdził.";
            case "postapo" -> "Ślad wygląda na rabunek, ale bardziej pasuje do wymuszonej ewakuacji.";
            case "realistyczny" -> "Najbardziej podejrzana osoba ma powód kłamać, ale nie musi być winna.";
            default -> "Jeśli gracze pójdą za pierwszym wrażeniem, dotrą do osoby niewinnej, ale powiązanej z prawdą.";
        };
    }

    private boolean isRandom(String value) {
        String normalized = settingKey(value);
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random") || normalized.isBlank();
    }

    private String settingKey(String value) {
        if (value == null) return "";
        String normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(java.util.Locale.ROOT).trim();
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

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
            "npc_horror", "clue", "cult_horror", "horror_creaturę",
            "suspect", "witness", "victim", "investigation_location",
            "ritual", "artifact_horror", "omen", "horror_document", "horror_escalation"
    );
    private static final Set<String> POSTAPO = Set.of(
            "survivor", "shelter", "supply_run", "zombie_variant",
            "survivor_group", "supplies", "postapo_location", "horde",
            "postapo_conflict", "moral_dilemma", "postapo_event", "disease_contamination", "vehicle_wreck"
    );
    private static final Set<String> SCIFI = Set.of(
            "npc_scifi", "planet", "space_station", "anomały",
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
                item("Szczęście", luck), item("Ruch", move), item("Bonus obrażeń", dmgBonus)
        )));
        sections.add(section("Zawód", occupation + " — " + occupationContext(occupation)));
        sections.add(section("Umiejętności", buildSkills(occupation, edu)));
        sections.add(section("Wygląd i zachowanie", name + ": " + pick(
                "sprawia wrazenie normalnosci. Jeden szczegol nie pasuje do reszty.",
                "ubiera sie starannie, mowi malo i slucha za duzo.",
                "jest nerwowy bez powodu, który chce podac.",
                "robi wszystko, zeby nie wychodzic poza swoją rutyne. Cos ja rozerwalo.",
                "żądaje pytania zanim odpowiada. Zawsze."
        )));
        sections.add(section("Historia", pick(
                "Pracuje tu od lat. Wie więcej niż mowi — i nie wie ze wie za duzo.",
                "Przeniosl sie tu niedawno. Uciekl przed czyms, co zdaje sie go dogonic.",
                "Mieszka tu od urodzenia. Zna kazdy zakatek i prawie kazdy sekret.",
                "Mial wyjechac. Zostal z powodu, którego juz nie pamietа wyraźnie.",
                "Przyjaciel spromowal go do miasta. Przyjaciel zniknął pol roku później."
        )));
        sections.add(section("Dylemat", pick(
                "Lojalnosc wobec kogos, kto nie zasluguje — ale zna prawde.",
                "Widzial cos, czego nie potrafi wytlumaczyc. To go stopniowo niszczy.",
                "Ma wiedze, która może kosztowac życie — swoje albo cudze.",
                "Pomogł ukryć cos wiele lat temu i zyl dobrze. Az do teraz.",
                "Chce zrobic cos wlasciwego, ale nie wie co jest wlasciwe."
        )));
        sections.add(section("Hak do śledztwa", pick(
                "Zna dojscie do miejsca, do którego gracze nie mogą dotrzec inaczej.",
                "Byl ostatnia osoba, która widziała ofiarę zywa — jeszcze o tym nie wie.",
                "Nosi przy sobie cos, co zmienia wszystko — nie wie co to jest.",
                "Kontakt z kims ważnym — ale tego kontaktu nie ujawni bez powodu.",
                "Prowadzil wlasne śledztwo. Zatrzymal sie w momencie, gdy zrobilo sie niebezpiecznie."
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
            case "Sledczy", "Śledczy"  -> pick("Prywatny detektyw", "Dziennikarz", "Policjant", "Oficer");
            case "Uczony"   -> pick("Profesor", "Lekarz", "Archeolog", "Psycholog", "Historyk");
            case "Elita"    -> pick("Prawnik", "Polityk", "Dyletatnt", "Pisarz", "Artysta");
            case "Mistyk"   -> pick("Okultysta", "Medium", "Wrozbiarz", "Kolekcjoner arkanow");
            case "Twardziel"-> pick("Zolnierz", "Bokser", "Marynarz", "Kryminalista");
            default         -> pick("Bibliotekarz", "Naucżyciel", "Pielęgniarka", "Sklepikarz",
                                    "Mechanik", "Sekretarka", "Kierowca", "Dzieńnikarz");
        };
    }

    private String occupationContext(String occupation) {
        return switch (occupation) {
            case "Prywatny detektyw" -> "pracuje na wlasny rachunek, zna ludzi których inni wola nie znac";
            case "Dzieńnikarz"       -> "wie za duzo i publikuje za malo";
            case "Policjant"         -> "sluzy lokalnej społecznośći, ale cena jest wysoka";
            case "Oficer"            -> "widzial wojne i cos jeszcze — i to cos go odnalazlo";
            case "Profesor",
                 "Historyk"          -> "akademik, który widzial cos podwazajacego jego metodologie";
            case "Lekarz"            -> "zna tajemnice pacjentow — nie zawsze to jest wygodne";
            case "Archeolog"         -> "wrócil z wyprawy z czyms, czego nie powinien byl brac";
            case "Psycholog"         -> "bada umysly i wie, ze niektóre rzeczy widać tylko z zewnątrz";
            case "Okultysta",
                 "Medium",
                 "Wrozbiarz",
                 "Kolekcjoner arkanow" -> "działa na granicy tego, co inni uznają za szarlatanerie";
            case "Zolnierz",
                 "Bokser",
                 "Marynarz"          -> "widzial przemoc i nauczyl sie z nia zyc — z mieszanym skutkiem";
            case "Kryminalista"      -> "zna zasady gry, w która reszta nie wie ze gra";
            case "Prawnik"           -> "reprezentuje klientow, z których jeden jest więcej niż jednym";
            default                  -> "prowadzi normalne życie — az do momentu gdy gracze sie pojawiaja";
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
                "Ukrywanie " + mid + "%", "Śledzenie " + mid + "%",
                "Biblioteka " + lib + "%", "Dostrzezenie " + spot + "%"
            };
            case "Dzieńnikarz" -> new String[]{
                "Biblioteka " + (lib + 15) + "%", "Języki obce " + mid + "%",
                "Psychologia " + psy + "%", "Fotografia " + high + "%",
                "Dostrzezenie " + spot + "%", "Przekonywanie " + mid + "%"
            };
            case "Policjant" -> new String[]{
                "Prawo " + mid + "%", "Strzelanie " + high + "%",
                "Śledzenie " + mid + "%", "Jezda " + (30 + random.nextInt(20)) + "%",
                "Pierwsza pomoc " + low + "%", "Dostrzezenie " + spot + "%"
            };
            case "Oficer" -> new String[]{
                "Strzelanie " + high + "%", "Walka " + mid + "%",
                "Nawigacja " + low + "%", "Pierwsza pomoc " + mid + "%",
                "Przywództwo " + mid + "%", "Śledzenie " + low + "%"
            };
            case "Profesor", "Historyk" -> new String[]{
                "Biblioteka " + (lib + 20) + "%", "Języki obce " + high + "%",
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
                "Biblioteka " + (lib + 10) + "%", "Języki obce " + mid + "%",
                "Wspinaczka " + low + "%", "Dostrzezenie " + spot + "%"
            };
            case "Psycholog" -> new String[]{
                "Psychologia " + high + "%", "Medycyna " + mid + "%",
                "Biblioteka " + lib + "%", "Perswazja " + (mid + 10) + "%",
                "Dostrzezenie " + spot + "%", "Języki obce " + low + "%"
            };
            case "Okultysta", "Medium", "Wrozbiarz", "Kolekcjoner arkanow" -> new String[]{
                "Okultyzm " + high + "%", "Historia " + mid + "%",
                "Biblioteka " + (lib + 10) + "%", "Języki obce " + mid + "%",
                "Psychologia " + psy + "%", "Perswazja " + mid + "%"
            };
            case "Zolnierz", "Bokser", "Marynarz" -> new String[]{
                "Walka " + high + "%", "Strzelanie " + mid + "%",
                "Pierwsza pomoc " + mid + "%", "Atletyka " + (mid + 10) + "%",
                "Nawigacja " + low + "%", "Śledzenie " + low + "%"
            };
            case "Kryminalista" -> new String[]{
                "Wlamywanie " + high + "%", "Ukrywanie " + (mid + 10) + "%",
                "Walka " + mid + "%", "Śledzenie " + mid + "%",
                "Przekonywanie " + psy + "%", "Dostrzezenie " + spot + "%"
            };
            case "Prawnik" -> new String[]{
                "Prawo " + high + "%", "Perswazja " + (mid + 10) + "%",
                "Biblioteka " + lib + "%", "Psychologia " + psy + "%",
                "Historia " + low + "%", "Języki obce " + low + "%"
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
                    section("Wygląd", title + " wygląda jak osoba, która od dawna nie spi spokojnie. Jeden detal zdradza kontakt z tajemnica."),
                    section("Zachowanie", pick("mowi zbyt cicho i ciagle nasluchuje", "odpowiada zanim pytanie zostanie dokonczone", "unika luster, okien i fotografii")),
                    section("Co ukrywa", pick("widzial prawdziwe źródło zjawiska", "pomogl zakopac pierwszy dowod", "nie jest pewien, czy jego wspomnienia sa jego wlasne")),
                    section("Jak może zaszkodzic", "Pod presja poda niepełna prawde albo skieruje graczy do miejsca, które samo jest pułapka.")
            );
            case "clue" -> List.of(
                    section("Typ", resólveClueType(params) + " | " + category),
                    section("Wiarygodność", clueReliability(params)),
                    section("Opis", clueDescription(category, title)),
                    section("Co sugeruje", clueImplication(category)),
                    section("Prawdziwe znaczenie", clueTruth(category)),
                    section("Co nie pasuje", clueFalseLead(category)),
                    section("Kolejny trop", "Sprawdz dokument, swiadka albo miejsce, które potwierdza tylko jeden element wskazowki.")
            );
            case "cult_horror" -> List.of(
                    stats(category, tone, system, "Zasieg", stringParam(params, "scope", "Lokalny")),
                    section("Wierzenia", title + " wierzy, ze strach jest forma objawienia, a prawda musi zostac ukryta przed niegotowymi."),
                    section("Lider", pick("uprzejmy lekarz znany w calej okolicy", "wdowa prowadzaca dom sierot", "archiwista, który niszczy tylko wybrane dokumenty")),
                    section("Rytuał", pick("powtarza się przy każdej pełni", "wymaga ciszy całej dzielnicy", "zaczyna się od publicznego aktu dobroci")),
                    section("Słabość", "Kult nie boi sie przemocy, ale boi sie ujawnienia sprzecznosci w swoich wierzeniach.")
            );
            case "horror_creaturę" -> List.of(
                    stats(category, tone, system, "Widoczność", stringParam(params, "visibilityLevel", "Czesciowa")),
                    section("Wygląd", title + " nigdy nie jest widziany w calosci. Swiadkowie zapamietuja tylko fragment: głos, zapach albo ruch."),
                    section("Ślady obecnosci", pick("mokre odciski na suchym drewnie", "zwierzeta patrzace w puste miejsce", "zdjecia z jedna rozmazana sylwetka")),
                    section("Sposob działania", pick("izoluje ofiarę od grupy", "powtarza głosy bliskich", "pojawia sie dopiero, gdy ktoś sklamie")),
                    section("Jak przetrwac", "Niech gracze poznaja zasade zachowania stworzenia. Walka może byc opcja, ale zrozumienie powinno dac przewage.")
            );
            case "survivor" -> List.of(
                    stats(category, tone, system, "Rola", stringParam(params, "role", "Losowa")),
                    section("Wygląd", title + " nosi rzeczy naprawiane wiele razy i trzyma najcenniejszy przedmiot blisko ciala."),
                    section("Umiejętność przetrwania", pick("zna bezpieczne przejścia przez ruiny", "potrafi filtrować wodę z byle czego", "rozpoznaje ludzi po śladach obozu")),
                    section("Trauma", pick("nie wchodzi do ciemnych pomieszczen", "liczy naboje nawet podczas rozmowy", "nie ufa nikomu, kto obiecuje schronienie")),
                    section("Czego chce", "Potrzebuje pomocy, ale nie powie od razu, jaki koszt poniosla poprzednia grupa.")
            );
            case "shelter" -> List.of(
                    stats(category, tone, system, "Typ schronienia", stringParam(params, "shelterType", "Losowy")),
                    section("Opis", title + " jest bezpieczne tylko na pierwszy rzut oka. Kazde zabezpieczenie wymaga zasobu, którego zaczyna brakowac."),
                    section("Zabezpieczenia", pick("podwojne drzwi i obserwator na dachu", "system dzwonkow z puszek", "stare kamery działające na resztkach pradu")),
                    section("Słaby punkt", pick("jedno wejście zna ktoś spoza grupy", "filtr powietrza wymaga wymiany", "wewnątrz narasta konflikt o racje")),
                    section("Sekret", "Schronienie istnieje, bo ktoś kiedys zamknal przed drzwiami ludzi proszacych o pomoc.")
            );
            case "supply_run" -> List.of(
                    stats(category, tone, system, "Cel wyprawy", stringParam(params, "supplyGoal", "Losowy")),
                    section("Lokacja", title + " znajduje sie w miejscu, które bylo codzienne przed upadkiem, a teraz jest pełne zlych skojarzen."),
                    section("Zasoby", pick("leki i opatrunki", "paliwo w zamknietym agregacie", "konserwy w zalanym magazynie")),
                    section("Komplikacja", pick("inna grupa przybywa w tym samym czasie", "zapas jest skażony albo uszkodzony", "powrót jest trudniejszy niż wejście")),
                    section("Konsekwencja porażki", "Brak zasobu uderza w konkretna osobe albo relacje w bazie, nie tylko w licznik ekwipunku.")
            );
            case "zombie_variant" -> List.of(
                    stats(category, tone, system, "Zagrożenie", stringParam(params, "threatLevel", "Średnie")),
                    section("Wygląd", title + " zdradza sposób śmierci albo mutacji. Gracze powinni rozpoznac wariant po jednym mocnym detalu."),
                    section("Zachowanie", pick("reaguje na cieplo, nie na dzwiek", "porusza sie tylko stadnie", "udaje bezruch, dopoki ktoś nie podejdzie")),
                    section("Jak go unikac", pick("niski halas nie wystarczy, trzeba ukryć zapach", "nie wchodzic w wąskie przejścia", "odciągnąc go światłem albo drganiami")),
                    section("Scena", "Pokaz wariant najpierw na ofierze lub śladach, zanim zaatakuje druzyne.")
            );
            case "npc_scifi" -> List.of(
                    stats(category, tone, system, "Rola", stringParam(params, "role", "Losowa")),
                    section("Identyfikator", title + " funkcjonuje w systemie pod rola sluzbowa, ale prywatnie używa innego imięnia."),
                    section("Funkcja", pick("technik odpowiedzialny za zamkniety modul", "kurier z nielegalnym ladunkiem", "analityk, który znalazl błąd w danych")),
                    section("Sekret", pick("jest kopia zapasowa kogos innego", "sprzedaje dane korporacji", "ukrywa objawy kontaktu z anomalia")),
                    section("Konflikt", "NPC może pomoc, ale jego problem techniczny albo prawny przejdzie na druzyne.")
            );
            case "planet" -> List.of(
                    stats(category, tone, system, "Typ planety", stringParam(params, "planetType", "Losowy")),
                    section("Srodowisko", title + " ma jeden dominujacy problem: pogoda, toksycznosc, grawitacje albo brak zaufania kolonistow."),
                    section("Kolonia", pick("kopalnia kontrolowana przez kontrakt", "naukowa baza bez aktualnych raportow", "port na granicy legalnej przestrzeni")),
                    section("Zasob", pick("rzadki mineral", "biologiczna probka", "stare dane nawigacyjne")),
                    section("Tajemnica", "Oficjalna mapa planety pomija miejsce, które widać z orbity.")
            );
            case "space_station" -> List.of(
                    stats(category, tone, system, "Stan", stringParam(params, "state", "Losowy")),
                    section("Funkcja", title + " miało byc miejscem pracy, ale teraz każda sekcja ma inne zasady przetrwania."),
                    section("Sekcje", pick("dok, hydroponika i stary modul mieszkalny", "laboratorium, rdzen danych i opuszczony hangar", "kaplica, areszt i komora lacznosci")),
                    section("Problem", pick("zanika lacznosc wewnętrzna", "jedna sekcja nie odpowiada", "system podtrzymywania życia klamie w raportach")),
                    section("Sekret", "Stacja nadal wykonuje rozkaz, którego nikt z obecnej zalogi nie zna.")
            );
            case "suspect" -> List.of(
                    stats(category, tone, system, "Poziom winy", stringParam(params, "guiltLevel", "Losowy")),
                    section("Imię i tlo", title + " jest znany w okolicy. Jego alibi brzmi wiarygodnie, dopoki ktoś nie sprawdzi szczegolów."),
                    section("Alibi", pick("Byl widziany przez jednego swiadka — który ma powod klamic.", "Dokumenty sie zgadzaja, ale jeden zapis jest zbyt czysty.", "Nikt nie pamietam go tamtej nocy, a on twierdzi ze byl wszedzie.")),
                    section("Motyw", pick("Pieniadze, które mial stracic.", "Tajemnica, która ofiara odkryla.", "Stara uraza, o której oficjalnie nikt nie wiedzial.")),
                    section("Podejrzane zachowanie", pick("Za szybko zaproponowal pomoc sledczym.", "Unika jednej konkretnej lokacji.", "Zna detale, o których nie powinien wiedziec.")),
                    section("Prawda", "Może byc winny, wspolnik albo swiadkiem, który ma wlasny powod milczec. Postaw graczy przed decyzja, zanim dasz pewnosc."),
                    section("Trop dalej", "Podejrzany wie cos więcej niż mowi. Prawdziwe pytanie to nie czy klamal, tylko dlaczego.")
            );
            case "witness" -> List.of(
                    stats(category, tone, system, "Stan psychiczny", stringParam(params, "mentalState", "Wstrzasniety")),
                    section("Kim jest", title + " byl we wlasciwym miejscu o zlej porze. Teraz nie jest pewien, czy to co widzial bylo prawdziwe."),
                    section("Co twierdzi ze widzial", pick("Sylwetke, która nie rzucala cienia.", "Kogos, kto oficjalnie nie zyje.", "Wydarzenie niemożliwe według wszystkich znanych zasad.")),
                    section("Czego nie mowi", pick("Zna sprawce, ale sie boi.", "Sam mial w tym udzial — bierny, ale jednak.", "To co widzial przeczy jego wlasnym przekonaniom i wolalby zapomniec.")),
                    section("Sprzecznosc w zeznaniu", pick("Godziny sie nie zgadzaja z innymi swiadkami.", "Opis miejsca nie pasuje do tego, co tam rzeczywiscie jest.", "Kilka slow to dosłowny cytat z dokumentu, do którego nie powinien miec dostępu.")),
                    section("Jak go przekonać", "Świadek przemówi, jeśli poczuje się bezpieczniej niż ze swoim milczeniem. Albo jeśli ktoś udowodni, że i tak już wiedział za dużo.")
            );
            case "victim" -> List.of(
                    stats(category, tone, system, "Stan ofiary", stringParam(params, "victimState", "Znaleziona")),
                    section("Kim byla", title + " prowadziła normalne życie — lub to co za takie uchodzilo. Jeden element nie pasuje do reszty."),
                    section("Ostatnie znane działania", pick("Umowila sie z kims, kogo nie wymieniala z imięnia.", "Wypłacila duza sume gotowki bez wytlumaczenia.", "Zostawila wiadomość, która brzmi inaczej po fakcie.")),
                    section("Ślady", pick("Brak śladów walki, ale tez brak osobistych rzeczy.", "Ktos wyczyScil jedno konkretne miejsce zbyt dokladnie.", "Przedmiot, który nie należy do ofiary i nie należy do nikogo w poblizu.")),
                    section("Sekret ofiary", pick("Wiedzila o sprawie wczesniej niż ktokolwiek inny.", "Sama zaczela śledztwo, które nie dotarło do żadnej instytucji.", "Miala kontakt z osoba, która teraz twierdzi ze jej nie znala.")),
                    section("Co jej los mowi o zagrozeniu", "Ofiara nie byla przypadkowa. Wybor mowi cos o tym, kto i dlaczego.")
            );
            case "investigation_location" -> List.of(
                    stats(category, tone, system, "Typ lokacji", stringParam(params, "locationType", "Losowa")),
                    section("Opis", title + " wygląda normalnie na pierwszy rzut oka. Jeden szczegol niszczy to wrazenie, jesli ktoś stanie w odpowiednim miejscu."),
                    section("Co widać na pierwszy rzut oka", pick("Porządek zbyt staranny jak na opuszczone miejsce.", "Niedziałający sprzęt, który włączono niedawno.", "Zapach, który nie pasuje do tego pomieszczenia.")),
                    section("Ukryty trop", pick("Dokument za lustra.", "Ślad biologiczny pod powierzchowna warstwa.", "Dwa rozne systemy ryglowania, zainstalowane w roznych epokach.")),
                    section("Falszywy trop", "W lokacji jest cos, co wygląda jak dowod, ale prowadzi do kogoś niewinnego. Gracze mogą to odkryc, jesli nie pojda na skroty."),
                    section("Zagrożenie", pick("Ktos obserwuje lokacje i wróci sprawdzic, czy zostala przeszukana.", "Miejsce jest niestabilne — fizycznie albo prawnie.", "Prawdziwy sprawca zostawił tu pulapke informacyjna."))
            );
            case "ritual" -> List.of(
                    stats(category, tone, system, "Etap rytualu", stringParam(params, "ritualStage", "W trakcie")),
                    section("Nazwa i cel", title + " to rytual, który istnial przed wszystkimi pamietajacymi go. Jego cel jest prostszy niż opisuja teksty."),
                    section("Wymagania", pick("Konkretne miejsce, konkretna godzina, konkretna osoba.", "Ofiarowanie czegoś, czego nie można odkupić.", "Obecność osoby, która nie wie ze uczestniczy.")),
                    section("Przebieg", "Etap: " + stringParam(params, "ritualStage", "W trakcie") + ". " + pick("Rytuał przebiega przez trzy noce — gracze są na drugiej.", "Każdy etap pozostawia fizyczny ślad widoczny z zewnątrz.", "Uczestnicy nie rozumieją co robią — tylko lider zna całość.")),
                    section("Objawy w okolicy", pick("Zwierzeta zachowuja sie nienaturalnie w promieniu polowy mili.", "Sny okolicznych mieszkańców zawieraja ten sam fragment.", "Zjawiska atmosferyczne nie zgadzaja sie z prognoza.")),
                    section("Jak go przerwac", "Przerwanie ma cene. Jesli gracze nie wiedza jaka, popelnia więcej bledow niż gdyby nie przerywali.")
            );
            case "artifact_horror" -> List.of(
                    stats(category, tone, system, "Typ artefaktu", stringParam(params, "artifactType", "Losowy")),
                    section("Wygląd", title + " nie wygląda na niebezpieczny. To jest część problemu."),
                    section("Historia", pick("Zmieńial właścicieli w regularnych odstepach czasu — zawsze w wyniku wypadku.", "Zostal stworzony dla konkretnego celu, który ktoś uznal za rozwiązanie.", "Nikt nie wie, kto go zrobil. Dokumenty sie nie zgadzaja.")),
                    section("Efekt", "Typ: " + stringParam(params, "artifactType", "Losowy") + ". " + pick("Zmieńia percepcje rzeczy zwiazanych ze śmiercia.", "Pozwala slyszec to, co powiedziano w tym miejscu dawno temu.", "Daje wiedze, za która pobiera cene później.")),
                    section("Koszt używania", pick("Uzytkownik zaczyna wiedziec rzeczy, których nie powinien.", "Przedmiot zaznacza użytkownika dla czegoś, co teraz go szuka.", "Kazde użycie zostawia trwaly ślad w osobowośći.")),
                    section("Kto go szuka", "Ktos juz wie, ze artefakt zmieńil właściciela. Niekoniecznie przyjdzie po niego od razu.")
            );
            case "omen" -> List.of(
                    stats(category, tone, system, "Typ omenu", stringParam(params, "omenType", "Losowy")),
                    section("Zjawisko", title + " zaczyna sie subtelnie. Do momentu, gdy ktoś go identyfikuje jako omen, jest juz pozno."),
                    section("Kiedy wystepuje", pick("Trzy razy przed wydarzeniem, w malejacych odstepach.", "Tylko wtedy, gdy ktoś z grupy jest sam.", "W miejscach zwiazanych z konkretna osoba lub decyzja.")),
                    section("Co zapowiada", pick("Smierc osoby, która omen widziała.", "Przebudzenie czegoś, co bylo zwiazane.", "Moment, po którym cofniecie bedzie niemożliwe.")),
                    section("Jak reaguje otoczenie", pick("Zwierzeta unikaja miejsca, w którym omen wystapil.", "Osoby, które nie widzialy omenu, czuja niepokój bez powodu.", "Jeden członek grupy nie może spac.")),
                    section("Jak go odsunac", "Omen można zignorować. Skutki ignorowania sa częścia fabuły.")
            );
            case "horror_document" -> List.of(
                    stats(category, tone, system, "Typ dokumentu", stringParam(params, "documentType", "Losowy")),
                    section("Treść", title + " wygląda oficjalnie. Dopiero trzecia lektura pokazuje, co jest nie tak."),
                    section("Autor", pick("Osoba, która oficjalnie nie miala dostępu do tych informacji.", "Ktos, kto w dacie dokumentu byl juz martwy.", "Autor bez nazwy — tylko inicjaly i numer, który nic nie znaczy dla graczy na razie.")),
                    section("Ukryty sens", pick("Informacje sa prawdziwe, ale selektywnie dobrane.", "Jeden fakt jest falszywy — celowo.", "Dokument jest kodem dla kogoś, kto wie jak czytac.")),
                    section("Trop", pick("Strona jest wyrwana — i ktoś to zaplanował.", "Marginesy zawieraja adnotacje innym charakterem pisma.", "Numeracja stron ma brakujacy fragment.")),
                    section("Niepokojacy szczegol", "Jeden element dokumentu jest niemozliwy. Gracze mogą go zauważyć lub nie — obie opcje maja konsekwencje.")
            );
            case "horror_escalation" -> List.of(
                    stats(category, tone, system, "Etap horroru", stringParam(params, "stage", "Srodkowy")),
                    section("Co sie zmienia", "Etap: " + stringParam(params, "stage", "Srodkowy") + ". " + pick("Zjawiska, które można bylo tlumaczyc inaczej, teraz nie daja sie tlumaczyc.", "Ktos z lokalnej społecznośći wiedzial od poczatku — i milczal.", "Reguly zmieniaja sie bez zapowiedzi.")),
                    section("Jak reaguje otoczenie", pick("Mieszkancy zamykaja sie i przestaja pytac o pomoc.", "Instytucje przestaja działać jak powinny.", "Osoby, które mialy pomoc, staja sie częścia problemu.")),
                    section("Co widza gracze", pick("Skutki bez przyczyny.", "Przyczyne bez możliwośći działan.", "Decyzje z ceną, która pojawia sie później.")),
                    section("Co stanie sie później", pick("Skala rosnie, zasiag sie rozszerza.", "Okno możliwośći zamknie sie w konkretnym momencie.", "Ktos straci cos nieodwracalnego, jesli gracze nie zadziałaja.")),
                    section("Jak przerwac eskalacje", "Zatrzymanie wymaga wiedzy, która gracze jeszcze nie maja — ale mogą miec, jesli żądaja wlasciwych pytan.")
            );
            case "survivor_group" -> List.of(
                    stats(category, tone, system, "Typ grupy", stringParam(params, "groupType", "Losowa")),
                    section("Nazwa i skład", title + " liczba od kilku do kilkunastu osob. Trzymaja sie razem z potrzeby, nie z wybóru."),
                    section("Lider", pick("Ktos, kto przejal dowodzenie w kryzysie i nigdy nie oddal władzy.", "Wybierany rotacyjnie — co powoduje więcej tarć niż powinno.", "Lider nominalny i lider faktyczny — i obie osoby wiedza o tym.")),
                    section("Zasady grupy", pick("Proste i egzekwowane surowo bez wyjatkow.", "Elastyczne, co oznacza ze sa nagiete przez tych z wpływami.", "Nieformalnie jedno: nie pytaj o to, co bylo przed grupą.")),
                    section("Zasoby", pick("Podstawowe zapasy na tydzien, brak marginesu bezpieczenstwa.", "Wiecej niż pokazuja — co budzi nieufnosc u nowych.", "Jedno unikalne zasoby, który wszystkich uzaleznia od jednej osoby.")),
                    section("Problem i konflikt", "Wewnetrzne napiecie jest gorsze niż zewnetrzne zagrożenie. Gracze wchodza w moment, gdy cos sie wlasnie zalamuje.")
            );
            case "supplies" -> List.of(
                    stats(category, tone, system, "Typ zasobow", stringParam(params, "supplyType", "Losowy")),
                    section("Co znaleziono", title + ". Wiekszosc jest w stanie używalnym, ale jeden element jest problematyczny."),
                    section("Ilosc", pick("Wystarczy na tydzien dla grupy — jesli nie bedzie strat.", "Mniej niż wygląda z zewnątrz.", "Wiecej niż potrzeba — co znaczy, ze ktoś to zostawił celowo.")),
                    section("Problem z zasobem", pick("Zapas jest częściowo skażony albo uszkodzony.", "Etykiety nie zgadzaja sie z zawartoscia.", "Ktos dal znak posiadania wlasnosci — nowy albo swiezy.")),
                    section("Kto jeszcze ich chce", pick("Inna grupa monitoruje te lokacje regularnie.", "Właściciel wróci — kwestia czasu.", "Ktos sledzil graczy od momentu, gdy zaczeli szukac.")),
                    section("Hak", "Zasoby mogą byc używane albo wymieniane. Wymiana otwiera kontakty, które maja wlasne oczekiwania.")
            );
            case "postapo_location" -> List.of(
                    stats(category, tone, system, "Typ lokacji", stringParam(params, "locationType", "Losowa")),
                    section("Opis", title + " bylo kiedys normalne. Teraz jest niebezpieczne z powodow, które sa czytelne dla kogoś uważnego."),
                    section("Co zostalo", pick("Struktura stoi, ale kazdy krok może byc ostatni.", "Kilka pomieszczen jest nadal uzytecznych, reszta jest pulapką.", "Miejsce zostalo częściowo sprzatniete przez kogos kto byl tu niedawno.")),
                    section("Zagrożenie", pick("Fizyczne: niestabilna konstrukcja z nieprzewidywalnymi miejscami.", "Biologiczne: ślady zarazenia lub kolonii.", "Ludzkie: ktoś traktuje to miejsce jako wlasnosc.")),
                    section("Ukryty zasob", pick("Magazyn za niewidocznym zejsciem.", "Generator, który może jeszcze działać.", "Przedmioty zostawione przez ostatnich użytkownikow z konkretnymi informacjąmi.")),
                    section("Ślad po dawnych mieszkancach", "Jeden szczegol mowi więcej o tym co sie stalo niż cale miejsce razem wziate.")
            );
            case "horde" -> List.of(
                    stats(category, tone, system, "Rozmiar hordy", stringParam(params, "size", "Średnia")),
                    section("Opis", title + " porusza sie w kierunku, który za kilka godzin stanie sie problemem grupy."),
                    section("Co ja prżyciaga", pick("Dzwiek agregatu, który ktoś uruchomil.", "Sygnal termiczny z schronienia.", "Jeden członek grupy zostawił ślad wychodzac po zasoby.")),
                    section("Jak zmienia sytuacje", pick("Blokuje główna drogę powrótu.", "Zmusza do wybóru: obrona schronienia albo opuszczenie go.", "Daje godzine — może dwie — na decyzje.")),
                    section("Możliwe rozwiązania", pick("Odciągnąć przez sygnały dalej.", "Przepuścić przez własną pozycję z minimalnymi stratami.", "Przetrzymać i dać się ominąć.")),
                    section("Scena", "Horda nie jest plotkama. Pokaz jeden element — halas, kurz, zapach — zanim stanie sie widoczna.")
            );
            case "postapo_conflict" -> List.of(
                    stats(category, tone, system, "Typ konfliktu", stringParam(params, "conflictType", "Losowy")),
                    section("Strony konfliktu", title + " — dwie strony, z których żadna nie ma racji w calosci."),
                    section("Powod", pick("Kontrola nad zasobem, bez którego obie strony przezyja krocej.", "Stara uraza sprzed upadku, która nie zostala rozwiążąna.", "Idealogiczne roznice, które sa tak naprawde o strachu.")),
                    section("Kto ma racje", "Obie strony maja część racji. Gracze dostana pełna informacje dopiero po rozmowie z obiema stronami."),
                    section("Co grozi eskalacja", pick("Jednorazowy wypad staje sie recydywa.", "Trzecia strona czeka na oslabionych zwyciezce.", "Jedna decyzja jednej strony wymknie sie spod kontroli.")),
                    section("Możliwe rozwiązania", "Rozwiązanie, które zadowoli obie strony, istnieje — ale wymaga czegoś od każdej z nich. Gracze mogą być mediatorami albo istotnymi elementami rozwiązania.")
            );
            case "moral_dilemma" -> List.of(
                    stats(category, tone, system, "Waga decyzji", stringParam(params, "decisionWeight", "Grupowa")),
                    section("Sytuacja", title + " wymaga decyzji, której nie da sie odroczyc i nie da sie cofnac."),
                    section("Opcja A", pick("Ocalic wiekszosc kosztem jednej osoby, która na to nie zasluzyła.", "Zrealizowac plan grupy kosztem czegoś, w co sie wierzyz.", "Ujawnic prawde, co nieodwracalnie cos zniszczy.")),
                    section("Opcja B", pick("Nie podejmowac działania — co tez jest decyzja ze skutkami.", "Dac szanse wszystkim kosztem większego ryzyka dla wszystkich.", "Ukryc prawde, zeby uchronic kogos kto może byc winny.")),
                    section("Koszt każdej decyzji", "Koszt opcji A jest natychmiastowy i widoczny. Koszt opcji B odlozony w czasie — i większy."),
                    section("Konsekwencje później", "Decyzja pozostaje z graczami. Nie jako mechanika — jako część historii, która inni pamietaja.")
            );
            case "postapo_event" -> List.of(
                    stats(category, tone, system, "Typ wydarzenia", stringParam(params, "eventType", "Losowe")),
                    section("Wydarzenie", title + " zmienia sytuacje grupy natychmiast. Nie bylo w planie."),
                    section("Natychmiastowy problem", pick("Wymaga zasobu, którego wlasnie brakuje.", "Dzieli grupe w najgorszym mozliwym momencie.", "Zmieńia priorytety w sposób, który koliduje ze wszystkim.")),
                    section("Okazja", pick("Może dac dostęp do czegoś, czego szukali.", "Tworzy okno czasowe na akcję, która wczesniej byla niemożliwa.", "Pokazuje informacje o wrogach albo sojusznikach.")),
                    section("Konsekwencja", "Wydarzenie zmienia stan świata o jeden krok. Decyzje podjete teraz maja skutki w nastepnej sesji.")
            );
            case "disease_contamination" -> List.of(
                    stats(category, tone, system, "Powaznosc", stringParam(params, "severity", "Średnia")),
                    section("Objawy", title + " nie jest natychmiast oczywista. Pierwsze objawy można wytlumaczyc inaczej."),
                    section("Źródło", pick("Woda ze zbiornika, który wydawal sie czysty.", "Kontakt z osoba, która nie wiedzial ze jest nosicielem.", "Miejsce, które wszyscy omijali — poza jednym członkiem grupy.")),
                    section("Jak wykryc", pick("Jeden objaw jest charakterystyczny dla konkretnego zagrożenia.", "Testy daja wynik po 24 godzinach — za pozno na preewencje.", "Ktos w grupie widzial to wczesniej i rozpoznaje.")),
                    section("Jak spowolnic", pick("Izolacja nosiciela — co wprowadza napiecie grupowe.", "Zasoby medyczne, których nie ma w obozie.", "Wiedza o źródle, zanim źródło sie rozszerzy.")),
                    section("Konsekwencje", "Powaznosc: " + stringParam(params, "severity", "Średnia") + ". Nieleczona zmienia sklad grupy. Leczona kosztuje zasob i czas, których tez brakuje.")
            );
            case "vehicle_wreck" -> List.of(
                    stats(category, tone, system, "Typ pojazdu", stringParam(params, "vehicleType", "Losowy")),
                    section("Opis", title + " stoi na poboczu od dawna. Ktos juz byl tu przed graczami."),
                    section("Co działa", pick("Silnik może odpalić po kilku godzinach pracy.", "Bak jest pusty, ale zbiornik awaryjny ma resztki.", "Klatka jest nienaruszona — może slużyć jako schronienie.")),
                    section("Co jest uszkodzone", pick("Podwozie po kolizji z czymś ciężkim.", "Szyby i zamki — ktoś wlazł z sila.", "System elektryczny, który decyduje o wielu innych elementach.")),
                    section("Co można znalezc", pick("Mapy albo dokumenty pozostawione przez poprzedniego właściciela.", "Ekwipunek, który nie należy do standardowego pojazdu tego typu.", "Rzeczy osobiste, które mówia więcej niż powinnny.")),
                    section("Kto może po niego przyjsc", "Pojazd jest zaznaczony na czyjejs mapie. Czas jest po stronie tego, kto może czekac.")
            );
            case "starship" -> List.of(
                    stats(category, tone, system, "Typ statku", stringParam(params, "shipType", "Losowy")),
                    section("Nazwa i klasa", title + " ma historii więcej niż dokumentacja mowi."),
                    section("Wygląd", pick("Zewnetrznie sprawny, wewnętrznie zdekapitalizowany.", "Modyfikacje, które nie sa w rejestrze i nie pasuja do siebie.", "Ślady napraw w miejscach, gdzie oficjalnie nie bylo nic do naprawy.")),
                    section("Problem techniczny", pick("Jeden system klamie w raportach i nikt nie wie od kiedy.", "Naped ma okienko niesprawnosci w regularnych odstepach.", "Kamera w jednym module zostala celowo wylaczona.")),
                    section("Ladune i zaloga", pick("Cargo jest zarejestrowane jako inne niż faktycznie.", "Jeden członek zalogi ma odrebny kontrakt nieznany reszcie.", "Ktos na pokladzie czeka na konkretne wspolrzedne.")),
                    section("Sekret", "Najważniejsza informacją o statku nie ma dokumentacji. Ktos zadbał o to celowo.")
            );
            case "colony" -> List.of(
                    stats(category, tone, system, "Typ kolonii", stringParam(params, "colonyType", "Losowa")),
                    section("Nazwa i polozenie", title + " istnieje na granicy tego, co centralna administracja uznaje za stabilne."),
                    section("Zarzadca", pick("Wydajny, ale zbyt lojalny wobec korporacji.", "Charismatyczny, ale opodal prawo tam gdzie potrzeba.", "Słaby — faktyczna władzą leży gdzie indziej.")),
                    section("Zasoby", pick("Jeden główny zasob i nic więcej — co tworzy zaleznosc.", "Samwystarczalnosc prawie osiagnieta, brakuje jednej części.", "Zasoby sa, ale dostęp kontroluje jedna osoba.")),
                    section("Konflikt", pick("Koloniści vs kontrakt — warunki nie sa tym, co obiecywano.", "Wewnetrzny podzial między dwiema frakcjami z nierownymi zasobami.", "Lokalne odkrycie zmieńilo priorytety wszystkich.")),
                    section("Zagrożenie", "Zewnetrzne zagrożenie istnieje — ale kolonia jest zbyt zajeata konfliktem wewnetrznym, zeby sie nim zajac.")
            );
            case "corporation" -> List.of(
                    stats(category, tone, system, "Branza", stringParam(params, "industry", "Losowa")),
                    section("Nazwa i produkt", title + " działa oficjalnie i legalnie. Wszystko inne jest kwestia definicji."),
                    section("Logo i slogan", pick("Czysty, profesjonalny branding skrywajacy procesy, o których klienci nie chca wiedziec.", "Rozpoznawalny symbol z historia, która firma aktywnie przepisuje.", "Minimalistyczny — bo nie ma co ukrywac temu, kto patrzy obok logika.")),
                    section("Metody", "Branza: " + stringParam(params, "industry", "Losowa") + ". " + pick("Dziala przez subkontrakty, wiec żadna decyzja nie ma jednego autora.", "Kupuje problemy zanim stana sie publiczne.", "Produkuje zaleznosc zanim klienci wiedza ze sa zalezni.")),
                    section("Sekret", pick("Jeden projekt, który nigdy nie zostal oficjalnie zamkniety.", "Ktos z zarzadu ma umowe z inna korporacja.", "Dane sa sprzedawane — klientom i o klientach jednoczesnie.")),
                    section("Wrog", "Korporacja ma konkretnego wroga. Czy sa to gracze, czy inna korporacja — zależy od kontekstu.")
            );
            case "scifi_mission" -> List.of(
                    stats(category, tone, system, "Typ misji", stringParam(params, "missionType", "Losowa")),
                    section("Zleceniodawca", title + " ma cel jasny na papierze. Cel faktyczny jest zaznaczony mniejszym drukiem."),
                    section("Cel", pick("Odzysk artefaktu, który oficjalnie nie byl tam zostawiony.", "Ochrona osoby, która oficjalnie nie potrzebuje ochrony.", "Misja rozpoznawcza z parametrami, które sugeruja akcję.")),
                    section("Lokacja", pick("Stacja, która miała byc opuszczona.", "Planeta z anomalia w danych nawigacyjnych.", "Wrak na szlaku, który jest zbyt regularnie oczyszczany.")),
                    section("Komplikacja", pick("Cel misji jest juz tam, gdzie drużyna ma pojechac — i nie chce wspolpracy.", "Inna drużyna ma ten sam zlecenie i inne instrukcje co do wspólpracy.", "Zleceniodawca zmienia parametry w trakcie.")),
                    section("Nagroda", "Nagroda jest realna. Pytanie czy zleceniodawca jest lojalny tak samo jak nagroda jest realna.")
            );
            case "alien_organism" -> List.of(
                    stats(category, tone, system, "Agresywnosc", stringParam(params, "aggression", "Terytorialna")),
                    section("Nazwa i wygląd", title + " nie pasuje do żadnej znane taksonomii. Jeden element wygląda znajomo, reszta nie."),
                    section("Cykl życia", pick("Fazy sa czytelne, ale przejścia między nimi sa nieprzewidywalne.", "Reprodukuje się szybciej niż skanery mogą rejestrowac.", "Latencja przed aktywacją sprawia, ze jest za pozno na reakcję.")),
                    section("Zachowanie", pick("Terytorialne: markuje obszar i reaguje na naruszenie.", "Adaptacyjne: zmienia metody po pierwszym nieudanym kontakcie.", "Pasozytniczne: szuka nosiciela, nie wroga.")),
                    section("Zagrożenie", "Agresywnosc: " + stringParam(params, "aggression", "Terytorialna") + ". " + pick("Bezpośrednie: fizyczne zagrożenie przy kontakcie.", "Pośrednie: zmienia srodowisko, zanim stanie sie problemem.", "Niewidoczne: aktywuje cos innego.")),
                    section("Słabość", "Słabość istnieje i może byc odkryta. Wymaga obserwacji, nie pierwszego ataku.")
            );
            case "technology" -> List.of(
                    stats(category, tone, system, "Typ technologii", stringParam(params, "technologyType", "Losowy")),
                    section("Nazwa i wygląd", title + " jest bardziej zaawansowana niż powinna byc w tym miejscu i czasie."),
                    section("Funkcja", pick("Robi dokladnie to co jest w specyfikacji, plus jedno co nie jest.", "Dziala z marginesem bledow, który nie powinien byc akceptowalny.", "Wymaga wiedzy, która nie jest w dostarczonej dokumentacji.")),
                    section("Wada", pick("Używanie zostawia dane u producenta.", "Jedno wejście jest niezabezpieczone w sposób, który wygląda na celowy.", "Limitowanie żywotności — po n użyciach wymaga serwisu u autoryzowanego serwisanta.")),
                    section("Kto jej szuka", pick("Producent chce ja odzysc i nie pytac dlaczego jest poza kanałem.", "Konkurencja chce wzor, nie egzemplarz.", "Jeden użytkownik zna zbyt wiele o tym, jak naprawde działa.")),
                    section("Hak", "Technologia może rozwiązać problem grupy. Ale skad pochodzi i kto za nia placil to pytania, które wróca.")
            );
            case "cyberware" -> List.of(
                    stats(category, tone, system, "Jakość", stringParam(params, "quality", "Przemyslowy")),
                    section("Nazwa i funkcja", title + " daje wymierna przewage. Cena jest inaczej opisana niż w ofercie."),
                    section("Efekt uboczny", pick("Zmiany neurologiczne widoczne dopiero po tygodniach użytkowania.", "Sygnatura biologiczna rozpoznawalna przez systemy monitorujace.", "Uzaleznienie od serwisu, który ma jeden autoryzowany punkt.")),
                    section("Producent", pick("Firma, która oficjalnie nie produkuje tego modelu.", "Źródło nieznane — ale jakość sugeruje zasoby większe niż rynek szary.", "Modyfikacja wojskowego standartu przez kogoś kto wiedzial co robi.")),
                    section("Nielegalna modyfikacja", "Jakość: " + stringParam(params, "quality", "Przemyslowy") + ". " + pick("Zablokowane fabryczne limity wydajnosci.", "Dodatkowy modul komunikacyjny bez dokumentacji.", "Usuniete zabezpieczenia, które istnialy z konkretnego powodu.")),
                    section("Hak", "Ktos, kto widzial ten model, bedzie mial pytania. Albo oferte.")
            );
            case "system_failure" -> List.of(
                    stats(category, tone, system, "Dotkniety system", stringParam(params, "affectedSystem", "Losowy")),
                    section("Awaria", title + " przestaje działać w momencie, gdy jest najbardziej potrzebny."),
                    section("Objawy", pick("Raporty wskazuja normalny stan, ale efekty sa nieoczekiwane.", "Jeden czujnik jest wylaczony — jedyny, który mialby ostrzec.", "System działa z 20% wydajnoscia i nikt nie zauważył kiedy to sie zaczelo.")),
                    section("Konsekwencje", "System: " + stringParam(params, "affectedSystem", "Losowy") + ". " + pick("Kaskadowy wpływ na zalezne systemy.", "Okno bezpieczenstwa dla czegoś z zewnątrz.", "Jedna osoba na pokladzie wiedzial ze to nastapi.")),
                    section("Jak naprawic", pick("Wymaga części, które sa, ale nie przy awarii.", "Procedura jest w dokumentacji — na zdalnym serwerze, który nie odpowiada.", "Naprawa wymaga wylaczenia drugiego systemu.")),
                    section("Co przeszkadza", "Naprawa jest możliwa. Czas, w którym trzeba to zrobic przy innych aktywnych zagrożeniach, nie jest.")
            );
            case "ship_threat" -> List.of(
                    stats(category, tone, system, "Typ zagrożenia", stringParam(params, "threatType", "Losowy")),
                    section("Zagrożenie", title + " zaczyna sie od sygnalu, który można zignorowac raz."),
                    section("Pierwsze oznaki", pick("Jeden członek zalogi zachowuje sie inaczej bez widocznego powodu.", "Poziomy energii w jednym module odchylaja sie od normy.", "Lacznosc zewnętrzna ma opoznienie, które nie istnialo wczesniej.")),
                    section("Kto wie", pick("Jeden członek zalogi wiedzial wczesniej i czeka z informacją.", "System AI zarejestrowal anomalie ale nie eskalowala alertu.", "Ktos na zewnątrz zdaje sobie sprawe z zagrożenia i nie poinformowal zalogi.")),
                    section("Co stanie sie później", pick("Zagrożenie rosnie liniowo az do punktu krytycznego.", "Jedno zdarzenie zmieńi charakter zagrożenia.", "Zagrożenie może sie cofnac, jesli nikt nie zadziała.")),
                    section("Możliwe rozwiązanie", "Typ: " + stringParam(params, "threatType", "Losowy") + ". " + pick("Wymaga wiedzy, która jest na pokładzie, ale nie w jednym miejscu.", "Wymaga decyzji, która ma równoprawne argumenty za i przeciw.", "Można rozwiązać bez strat, jeśli ktoś ma odwagę podjąć niepopularną decyzję."))
            );
            default -> List.of(
                    stats(category, tone, system, "Stabilnosc", stringParam(params, "stability", "Niestabilna")),
                    section("Opis", title + " lamie intuicyjne zasady miejsca, w którym wystepuje."),
                    section("Pierwsze objawy", pick("zegary rozjezdzaja sie o kilka minut", "ludzie pamietaja inne wersje rozmow", "czujniki pokazuja ksztalt, którego nie ma")),
                    section("Efekt", pick("zmienia priorytety systemów", "przyciąga sygnały z nieznanego źródła", "tworzy kopie danych z przyszłymi znacznikami czasu")),
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
            case "horror_creaturę" -> pick("Ten, Ktory Puka", "Cien pod Schodami", "Glos z Mokrej Studni");
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
            case "investigation_location" -> pick("Piwnica przy Czarnej Ulicy", "Archiwum bez Sygnatury", "Dom, Ktory Zmieńil Właściciela");
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
            case "disease_contamination" -> pick("Kaszel z Sektóra B", "Goraczka bez Przyczyny", "Skazenie Wodociagow");
            case "vehicle_wreck" -> pick("Ciezarowka przy Zjezdzie", "Bus Szkolny Bez Kol", "Woz Bojowy z Otwartymi Drzwiami");
            case "starship" -> pick("ISV Corveaux", "Marginal Run", "Niezarejestrowany Pol-Zero");
            case "colony" -> pick("Nowy Ostrow", "Stacja Dolna Hespera", "Kolonia 7 Listopada");
            case "corporation" -> pick("Vantage Systems", "Nexodyne Corp", "Bledna Linia Badawcza");
            case "scifi_mission" -> pick("Zlecenie z Baza Lima", "Kontrakt Bez Sygnatury", "Operacja Cicha Punkt");
            case "alien_organism" -> pick("Forma bez Nazwy", "Nosiciel Trzeciego Szczebla", "Obiekt Biologiczny Zero-Cztery");
            case "technology" -> pick("Prototyp bez Serii", "Modul Nieznanych Specyfikacji", "Urzadzenie Przed Rynkiem");
            case "cyberware" -> pick("Wzmocnienie Serii V", "Interfejs bez Certyfikatu", "Nielegalny Modul Sensoryczny");
            case "system_failure" -> pick("Awaria Podsystemu Alfa", "Blad Rdzenia Nawigacyjnego", "Utrata Kontroli Sektóra C");
            case "ship_threat" -> pick("Nieznany Sygnal na Pokladzie", "Zagrożenie Wewnatrz Modulu Trzeciego", "Problem z Membrana Kadluba");
            default -> pick("Pekniecie Delta", "Echo spoza Mapy", "Anomalia Czarny Sygnet");
        };
    }

    private String labelFor(String code) {
        return switch (code) {
            case "npc_horror" -> "NPC horror";
            case "clue" -> "Wskazówka";
            case "cult_horror" -> "Kult horror";
            case "horror_creaturę" -> "Istota horror";
            case "survivor" -> "Ocalały";
            case "shelter" -> "Schronienie";
            case "supply_run" -> "Wyprawa po zasoby";
            case "zombie_variant" -> "Wariant zombie";
            case "npc_scifi" -> "NPC sci-fi";
            case "planet" -> "Planeta";
            case "space_station" -> "Stacja kosmiczna";
            case "suspect" -> "Podejrzany";
            case "witness" -> "Świadek";
            case "victim" -> "Ofiara";
            case "investigation_location" -> "Miejsce śledztwa";
            case "ritual" -> "Rytuał";
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
            case "disease_contamination" -> "Choroba / skażenie";
            case "vehicle_wreck" -> "Wrak pojazdu";
            case "starship" -> "Statek kosmiczny";
            case "colony" -> "Kolonia";
            case "corporation" -> "Korporacja";
            case "scifi_mission" -> "Misja sci-fi";
            case "alien_organism" -> "Obcy organiżm";
            case "technology" -> "Technologia";
            case "cyberware" -> "Cyberwzmocnienie";
            case "system_failure" -> "Awaria systemu";
            case "ship_threat" -> "Zagrożenie na statek";
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

    private String resólveClueType(Map<String, Object> params) {
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
            case "fantasy" -> pick("ktoś z lokalnych zna stary symbol", "magiczna przysięga nadal działa", "winny miał dostęp do miejsca przez sojusznika", "relikwia zmieńiła właściciela bez świadków", "lokalny herb został użyty niezgodnie z prawem");
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

    private String clueReliability(Map<String, Object> params) {
        String requested = stringParam(params, "reliability", "Losowa");
        if (!isRandom(requested)) {
            return requested;
        }
        return pick("Prawdziwa", "Częściowo prawdziwa", "Zwodnicza", "Fałszywa, ale prowadzi do czegoś ważnego");
    }

    private String clueTruth(String setting) {
        return switch (settingKey(setting)) {
            case "fantasy" -> "Najważniejszy element wskazuje na osobe albo przysiege, nie na sam przedmiot.";
            case "sci-fi", "scifi" -> "Metadane zdradzaja ingerencje po fakcie.";
            case "postapo" -> "Ślad pokazuje, kto znal drogę przez zabezpieczenia.";
            case "realistyczny" -> "Dowód potwierdza dostęp, czas albo relacje między osobami.";
            default -> "Wskazówka jest przydatna dopiero po porównaniu z drugą relacją.";
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

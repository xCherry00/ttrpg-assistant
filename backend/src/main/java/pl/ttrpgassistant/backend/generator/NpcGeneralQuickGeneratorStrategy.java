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
public class NpcGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public NpcGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "npc".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String setting = setting(params);
        String requestedRole = stringParam(params, "role", "Losowa");
        List<?> roles = rolesFor(setting, pool);
        String role = randomChoice(requestedRole) || !containsOption(roles, requestedRole)
                ? pick(roles)
                : requestedRole;
        String motif = motifFor(params, setting);
        String race = raceFor(setting);

        String fullName = nameFor(setting, pool);
        String appearance = appearanceFor(setting, pool);
        String personality = pick(personalitiesFor(setting, pool));
        String motivation = pick(motivationsFor(setting, pool));

        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(section("Kim jest", ("Fantasy".equalsIgnoreCase(setting) ? race + ", " : "") + role + "."));
        sections.add(section("Motyw", motif + "."));
        sections.add(section("Wyglad", appearance + ". Ma jeden charakterystyczny detal, ktory latwo zapamietac przy stole."));
        sections.add(section("Osobowosc", personality + ". " + motivation + "."));

        return new GeneratorStructuredResultResponse(
                null,
                "npc",
                "general.quick",
                fullName,
                role + " | " + setting,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("npc", "any", "general.quick")
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection(
                "text",
                GeneratorTextSanitizer.clean(title),
                GeneratorTextSanitizer.clean(content),
                List.of()
        );
    }

    private String setting(Map<String, Object> params) {
        String requested = stringParam(params, "setting", "Losowy");
        return randomChoice(requested)
                ? pick(List.of("Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny"))
                : requested;
    }

    private String nameFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of("Nadia Quell", "Unit Sera-9", "dr Vale Korr", "Orin Pax", "Mika Voss", "Ilya Ren", "Kade Morra", "Sana Vey", "Taro Nix", "Juno Ardent"));
            case "postapo" -> pick(List.of("Kruk", "Mila", "Stary Borys", "IgÄąâ€ša", "Mechanik Zero", "Sucha", "Rafa", "Cichy Jan", "Matka Ruta", "SĂ„â„˘p"));
            case "horror" -> pick(List.of("Elena Ward", "Marek Voss", "Siostra Irena", "Oskar Feld", "Helena Nort", "Jan Rudzki", "Marta Koss", "Antoni Hale", "RÄ‚Ĺ‚ÄąÄ˝a Stein", "Wiktor Lenz"));
            case "realistyczny" -> pick(List.of("Anna Kowal", "Marek Lis", "Irena Nowak", "Tomasz Ward", "Helena Koss", "Piotr Wrona", "Alicja Marzec", "Nina Sowa", "Karol BieÄąâ€ž", "Ewa KrÄ‚Ĺ‚l"));
            default -> pick(asList(pool.get("givenNames"))) + " " + pick(asList(pool.get("familyNames")));
        };
    }

    private String raceFor(String setting) {
        if (!"fantasy".equals(normalize(setting))) {
            return "";
        }
        return pick(List.of(
                "CzÄąâ€šowiek", "Elf", "Krasnolud", "NizioÄąâ€šek", "Gnom", "PÄ‚Ĺ‚Äąâ€šelf", "PÄ‚Ĺ‚Äąâ€šork", "Tiefling",
                "Smocze dzieciĂ„â„˘", "Aasimar", "Goblin", "Ork", "Kobold", "LeÄąâ€şny duch w ludzkiej skÄ‚Ĺ‚rze"
        ));
    }

    private String motifFor(Map<String, Object> params, String setting) {
        String requested = stringParam(params, "motif", "Losowy");
        List<String> motifs = switch (normalize(setting)) {
            case "fantasy" -> List.of("DÄąâ€šug", "Zakazana magia", "Rodzina", "Zdrada", "Ambicja", "Relikwia", "Zemsta", "PrzysiĂ„â„˘ga", "Ucieczka", "Tajemnica rodu");
            case "horror" -> List.of("Wina", "Obsesja", "Zaginiona osoba", "Koszmar", "Milczenie", "Kult", "FaÄąâ€šszywe wspomnienie", "Zakazany dowÄ‚Ĺ‚d", "Strach przed domem", "Niechciane dziedzictwo");
            case "sci-fi", "scifi" -> List.of("Kontrakt", "Dane", "Implant", "Dezercja", "DÄąâ€šug korporacyjny", "FaÄąâ€šszywa toÄąÄ˝samoÄąâ€şĂ„â€ˇ", "Awaria", "Zakazana technologia", "Misja ratunkowa", "Ucieczka z kolonii");
            case "postapo" -> List.of("Przetrwanie", "Woda", "Leki", "Rodzina", "Utracone schronienie", "Wina ocalaÄąâ€šego", "Stary szlak", "GÄąâ€šÄ‚Ĺ‚d", "Bezpieczna zima", "Zdradzona osada");
            default -> List.of("Kariera", "Sekret", "DÄąâ€šug", "Rodzina", "Ambicja", "Strach", "UkÄąâ€šad", "ZnikniĂ„â„˘cie", "Reputacja", "Ostatnia szansa");
        };
        if (!randomChoice(requested) && motifs.stream().anyMatch(motif -> normalize(motif).equals(normalize(requested)))) {
            return requested;
        }
        return pick(motifs);
    }

    private List<?> rolesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pilot", "Mechanik", "Medyk", "Najemnik", "Analityk", "Przemytnik", "Oficer stacji", "Haker", "Dyplomata", "InÄąÄ˝ynier napĂ„â„˘du", "Kurier orbitalny", "ÄąÂowca danych");
            case "postapo" -> List.of("OcalaÄąâ€šy", "Lider osady", "Szabrownik", "Medyk", "ÄąÂowca zasobÄ‚Ĺ‚w", "StraÄąÄ˝nik bramy", "Handlarz wodĂ„â€¦", "Zwiadowca", "Mechanik", "Kucharz osady", "Kaznodzieja", "ByÄąâ€šy ÄąÄ˝oÄąâ€šnierz");
            case "horror" -> List.of("ÄąĹˇledczy", "ÄąĹˇwiadek", "Podejrzany", "Lekarz", "Bibliotekarz", "Okultysta", "Dziennikarz", "KsiĂ„â€¦dz", "Dozorca", "Fotograf", "Patolog", "Archiwistka");
            case "realistyczny" -> List.of("Dziennikarz", "Policjant", "Lekarz", "Prawnik", "Kierowca", "UrzĂ„â„˘dnik", "Nauczyciel", "Ochroniarz", "Recepcjonistka", "Technik", "SĂ„â€¦siad", "WÄąâ€šaÄąâ€şciciel baru");
            default -> asList(pool.get("roles"));
        };
    }

    private String appearanceFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of(
                    "Nosi zuzyty kombinezon z niezgodnymi oznaczeniami i implant przy skroni",
                    "Ma spokojny glos, oczy po korekcji optycznej i narzedzia przypiete do pasa",
                    "Wyglada jak ktos, kto od dawna sypia w fotelu pilota",
                    "Ma rekawice serwisowe, slady po oparzeniach i zbyt czysty identyfikator"
            ));
            case "postapo" -> pick(List.of(
                    "Nosi warstwowe ubrania, prowizoryczny pancerz i plecak naprawiany drutem",
                    "Liczy wyjscia z pomieszczenia, zanim zacznie rozmowe",
                    "Trzyma najcenniejszy przedmiot blisko ciala i nie odwraca sie plecami",
                    "Ma maske przeciwpylowa na szyi, nawet kiedy powietrze wyglada czysto"
            ));
            case "horror" -> pick(List.of(
                    "Wyglada zwyczajnie, ale rece zdradzaja wiele nieprzespanych nocy",
                    "Mowi cicho, unika luster i reaguje za szybko na jedno slowo",
                    "Elegancki ubior psuje zapach wilgoci, lekow albo starego papieru",
                    "Nosi przy sobie notatnik zapisany tym samym zdaniem"
            ));
            case "realistyczny" -> pick(List.of(
                    "Ma zmeczona twarz, praktyczne ubranie i ruchy kogos stalego w rutynie",
                    "Wyglada na osobe, ktora wie wiecej niz powinna mowic",
                    "Jest uprzejmy, ale obserwuje rozmowce zanim odpowie",
                    "Ma telefon z peknietym ekranem i kieszenie pelne paragonow"
            ));
            default -> pick(List.of(
                    "Ma znoszony plaszcz, czujne spojrzenie i rece przyzwyczajone do pracy",
                    "Nosi prosty stroj z jednym zbyt drogim dodatkiem",
                    "Porusza sie ostroznie, jakby sluchal czegos za sciana",
                    "Wyglada na osobe, ktora przyszla tu w konkretnym celu"
            ));
        };
    }
    private List<?> personalitiesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pragmatyczny i precyzyjny", "Sarkastyczny, ale lojalny po podpisaniu umowy", "Nerwowy, gdy systemy milczĂ„â€¦", "Zbyt spokojny pod ostrzaÄąâ€šem", "Ufa procedurom bardziej niÄąÄ˝ ludziom");
            case "postapo" -> List.of("Nieufny, konkretny i oszczĂ„â„˘dny w sÄąâ€šowach", "Pomaga, ale zawsze liczy koszt", "Twardy na pokaz, zmĂ„â„˘czony pod spodem", "ÄąĹˇmieje siĂ„â„˘ tylko wtedy, gdy sytuacja robi siĂ„â„˘ zÄąâ€ša", "Nie lubi obietnic bez zapÄąâ€šaty z gÄ‚Ĺ‚ry");
            case "horror" -> List.of("Uprzejmy, lecz bliski zaÄąâ€šamania", "Racjonalizuje rzeczy, ktÄ‚Ĺ‚rych juÄąÄ˝ nie umie wyjaÄąâ€şniĂ„â€ˇ", "Zbyt spokojny jak na to, co widziaÄąâ€š", "WciĂ„â€¦ÄąÄ˝ poprawia jeden detal ubrania", "Odpowiada tak, jakby ktoÄąâ€ş go podsÄąâ€šuchiwaÄąâ€š");
            default -> asList(pool.get("personalities"));
        };
    }

    private List<?> motivationsFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Chce spÄąâ€šaciĂ„â€ˇ kontrakt zanim ktoÄąâ€ş sprawdzi jego prawdziwe dane", "Szuka dostĂ„â„˘pu do systemu, ktÄ‚Ĺ‚ry moÄąÄ˝e go oczyÄąâ€şciĂ„â€ˇ", "Chroni zaÄąâ€šogĂ„â„˘ przed informacjĂ„â€¦, ktÄ‚Ĺ‚ra rozbiÄąâ€šaby misjĂ„â„˘", "Potrzebuje czĂ„â„˘Äąâ€şci, ktÄ‚Ĺ‚rej nie wolno kupiĂ„â€ˇ legalnie", "PrÄ‚Ĺ‚buje ukryĂ„â€ˇ bÄąâ€šĂ„â€¦d, ktÄ‚Ĺ‚ry moÄąÄ˝e kosztowaĂ„â€ˇ ÄąÄ˝ycie");
            case "postapo" -> List.of("Potrzebuje lekÄ‚Ĺ‚w dla kogoÄąâ€ş z osady", "Chce znaleÄąĹźĂ„â€ˇ bezpieczne miejsce zanim zima zamknie drogi", "Ukrywa zasÄ‚Ĺ‚b, ktÄ‚Ĺ‚ry moÄąÄ˝e wywoÄąâ€šaĂ„â€ˇ konflikt", "Szuka osoby zabranej przez innĂ„â€¦ grupĂ„â„˘", "Chce odzyskaĂ„â€ˇ mapĂ„â„˘, zanim trafi w zÄąâ€še rĂ„â„˘ce");
            case "horror" -> List.of("Chce udowodniĂ„â€ˇ, ÄąÄ˝e to nadal ma racjonalne wyjaÄąâ€şnienie", "Szuka osoby, ktÄ‚Ĺ‚ra zniknĂ„â„˘Äąâ€ša po tej samej wskazÄ‚Ĺ‚wce", "PrÄ‚Ĺ‚buje naprawiĂ„â€ˇ bÄąâ€šĂ„â€¦d sprzed lat", "Chroni kogoÄąâ€ş, kto moÄąÄ˝e byĂ„â€ˇ winny", "Chce opuÄąâ€şciĂ„â€ˇ miasto, ale boi siĂ„â„˘ drogi");
            default -> asList(pool.get("motivations"));
        };
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean randomChoice(String value) {
        String normalized = normalize(value);
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random");
    }

    private boolean containsOption(List<?> options, String requested) {
        return options.stream().anyMatch(option -> String.valueOf(option).equalsIgnoreCase(requested));
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
}




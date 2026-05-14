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
import java.util.LinkedHashMap;
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
        boolean includeSecret = booleanParam(params, "includeSecret", true);

        String fullName = nameFor(setting, pool);
        String appearance = appearanceFor(setting, pool);
        String personality = pick(personalitiesFor(setting, pool));
        String motivation = pick(motivationsFor(setting, pool));
        String secret = includeSecret ? pick(secretsFor(setting, pool)) : null;

        List<GeneratorOutputSection> sections = new ArrayList<>();
        sections.add(section("Kim jest", ("Fantasy".equalsIgnoreCase(setting) ? race + ", " : "") + role + "."));
        sections.add(section("Motyw", motif + "."));
        sections.add(section("Wygląd", appearance + "."));
        sections.add(section("Osobowość", personality + ". " + motivation + "."));
        if (secret != null && !secret.isBlank()) {
            sections.add(section("Sekret", secret + "."));
        }
        sections.add(new GeneratorOutputSection("stats", "Szybkie dane", null, List.of(
                item("Setting", setting),
                item("Rola", role),
                item("Motyw", motif),
                item("Rasa", "Fantasy".equalsIgnoreCase(setting) ? race : "Nie dotyczy"),
                item("Źródło", "seed")
        )));

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
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private Map<String, Object> item(String label, Object value) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("label", label);
        item.put("value", value);
        return item;
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
            case "postapo" -> pick(List.of("Kruk", "Mila", "Stary Borys", "Igła", "Mechanik Zero", "Sucha", "Rafa", "Cichy Jan", "Matka Ruta", "Sęp"));
            case "horror" -> pick(List.of("Elena Ward", "Marek Voss", "Siostra Irena", "Oskar Feld", "Helena Nort", "Jan Rudzki", "Marta Koss", "Antoni Hale", "Róża Stein", "Wiktor Lenz"));
            case "realistyczny" -> pick(List.of("Anna Kowal", "Marek Lis", "Irena Nowak", "Tomasz Ward", "Helena Koss", "Piotr Wrona", "Alicja Marzec", "Nina Sowa", "Karol Bień", "Ewa Król"));
            default -> pick(asList(pool.get("givenNames"))) + " " + pick(asList(pool.get("familyNames")));
        };
    }

    private String raceFor(String setting) {
        if (!"fantasy".equals(normalize(setting))) {
            return "";
        }
        return pick(List.of(
                "Człowiek", "Elf", "Krasnolud", "Niziołek", "Gnom", "Półelf", "Półork", "Tiefling",
                "Smocze dziecię", "Aasimar", "Goblin", "Ork", "Kobold", "Leśny duch w ludzkiej skórze"
        ));
    }

    private String motifFor(Map<String, Object> params, String setting) {
        String requested = stringParam(params, "motif", "Losowy");
        List<String> motifs = switch (normalize(setting)) {
            case "fantasy" -> List.of("Dług", "Zakazana magia", "Rodzina", "Zdrada", "Ambicja", "Relikwia", "Zemsta", "Przysięga", "Ucieczka", "Tajemnica rodu");
            case "horror" -> List.of("Wina", "Obsesja", "Zaginiona osoba", "Koszmar", "Milczenie", "Kult", "Fałszywe wspomnienie", "Zakazany dowód", "Strach przed domem", "Niechciane dziedzictwo");
            case "sci-fi", "scifi" -> List.of("Kontrakt", "Dane", "Implant", "Dezercja", "Dług korporacyjny", "Fałszywa tożsamość", "Awaria", "Zakazana technologia", "Misja ratunkowa", "Ucieczka z kolonii");
            case "postapo" -> List.of("Przetrwanie", "Woda", "Leki", "Rodzina", "Utracone schronienie", "Wina ocalałego", "Stary szlak", "Głód", "Bezpieczna zima", "Zdradzona osada");
            default -> List.of("Kariera", "Sekret", "Dług", "Rodzina", "Ambicja", "Strach", "Układ", "Zniknięcie", "Reputacja", "Ostatnia szansa");
        };
        if (!randomChoice(requested) && motifs.stream().anyMatch(motif -> normalize(motif).equals(normalize(requested)))) {
            return requested;
        }
        return pick(motifs);
    }

    private List<?> rolesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pilot", "Mechanik", "Medyk", "Najemnik", "Analityk", "Przemytnik", "Oficer stacji", "Haker", "Dyplomata", "Inżynier napędu", "Kurier orbitalny", "Łowca danych");
            case "postapo" -> List.of("Ocalały", "Lider osady", "Szabrownik", "Medyk", "Łowca zasobów", "Strażnik bramy", "Handlarz wodą", "Zwiadowca", "Mechanik", "Kucharz osady", "Kaznodzieja", "Były żołnierz");
            case "horror" -> List.of("Śledczy", "Świadek", "Podejrzany", "Lekarz", "Bibliotekarz", "Okultysta", "Dziennikarz", "Ksiądz", "Dozorca", "Fotograf", "Patolog", "Archiwistka");
            case "realistyczny" -> List.of("Dziennikarz", "Policjant", "Lekarz", "Prawnik", "Kierowca", "Urzędnik", "Nauczyciel", "Ochroniarz", "Recepcjonistka", "Technik", "Sąsiad", "Właściciel baru");
            default -> asList(pool.get("roles"));
        };
    }

    private String appearanceFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of(
                    "Nosi zużyty kombinezon z niezgodnymi oznaczeniami i implant przy skroni",
                    "Ma spokojny głos, oczy po korekcji optycznej i narzędzia przypięte do pasa",
                    "Wygląda jak ktoś, kto od dawna sypia w fotelu pilota",
                    "Ma rękawice serwisowe, ślady po oparzeniach plazmą i zbyt czysty identyfikator",
                    "Porusza się ostrożnie, jakby stale słyszał opóźniony alarm"
            ));
            case "postapo" -> pick(List.of(
                    "Nosi warstwowe ubrania, prowizoryczny pancerz i plecak naprawiany drutem",
                    "Liczy wyjścia zanim zacznie rozmowę",
                    "Trzyma najcenniejszy przedmiot blisko ciała i nie odwraca się plecami",
                    "Ma twarz spaloną słońcem i dłonie osoby, która naprawiała wszystko po kilka razy",
                    "Nosi maskę przeciwpyłową na szyi, nawet kiedy powietrze wygląda czysto"
            ));
            case "horror" -> pick(List.of(
                    "Wygląda zwyczajnie, ale ma ręce osoby, która od tygodni nie śpi",
                    "Mówi cicho, unika luster i reaguje za szybko na jedno słowo",
                    "Elegancki ubiór psuje zapach wilgoci, leków albo starego papieru",
                    "Ma pod oczami cień, którego nie tłumaczy zmęczenie",
                    "Nosi przy sobie notatnik zapisany tym samym zdaniem"
            ));
            case "realistyczny" -> pick(List.of(
                    "Ma zmęczoną twarz, praktyczne ubranie i ruchy kogoś stałego w rutynie",
                    "Wygląda na osobę, która wie więcej niż powinna mówić",
                    "Jest uprzejmy, ale obserwuje rozmówcę zanim odpowie",
                    "Ma telefon z pękniętym ekranem i kieszenie pełne paragonów",
                    "Uśmiecha się zawodowo, lecz ramiona ma spięte"
            ));
            default -> pick(asList(pool.get("appearances")));
        };
    }

    private List<?> personalitiesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pragmatyczny i precyzyjny", "Sarkastyczny, ale lojalny po podpisaniu umowy", "Nerwowy, gdy systemy milczą", "Zbyt spokojny pod ostrzałem", "Ufa procedurom bardziej niż ludziom");
            case "postapo" -> List.of("Nieufny, konkretny i oszczędny w słowach", "Pomaga, ale zawsze liczy koszt", "Twardy na pokaz, zmęczony pod spodem", "Śmieje się tylko wtedy, gdy sytuacja robi się zła", "Nie lubi obietnic bez zapłaty z góry");
            case "horror" -> List.of("Uprzejmy, lecz bliski załamania", "Racjonalizuje rzeczy, których już nie umie wyjaśnić", "Zbyt spokojny jak na to, co widział", "Wciąż poprawia jeden detal ubrania", "Odpowiada tak, jakby ktoś go podsłuchiwał");
            default -> asList(pool.get("personalities"));
        };
    }

    private List<?> motivationsFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Chce spłacić kontrakt zanim ktoś sprawdzi jego prawdziwe dane", "Szuka dostępu do systemu, który może go oczyścić", "Chroni załogę przed informacją, która rozbiłaby misję", "Potrzebuje części, której nie wolno kupić legalnie", "Próbuje ukryć błąd, który może kosztować życie");
            case "postapo" -> List.of("Potrzebuje leków dla kogoś z osady", "Chce znaleźć bezpieczne miejsce zanim zima zamknie drogi", "Ukrywa zasób, który może wywołać konflikt", "Szuka osoby zabranej przez inną grupę", "Chce odzyskać mapę, zanim trafi w złe ręce");
            case "horror" -> List.of("Chce udowodnić, że to nadal ma racjonalne wyjaśnienie", "Szuka osoby, która zniknęła po tej samej wskazówce", "Próbuje naprawić błąd sprzed lat", "Chroni kogoś, kto może być winny", "Chce opuścić miasto, ale boi się drogi");
            default -> asList(pool.get("motivations"));
        };
    }

    private List<?> secretsFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Ma drugi kontrakt z inną frakcją", "Jego implant zapisuje rozmowy bez zgody", "Zna prawdziwy cel lotu", "Jest kopią osoby uznanej za zmarłą", "Sprzedał dostęp komuś spoza załogi");
            case "postapo" -> List.of("Wpuścił kiedyś zagrożenie do schronienia", "Zna trasę do zasobu, ale nie chce wracać sam", "Ukrywa objawy choroby", "Oddał czyjeś nazwisko za własne bezpieczeństwo", "Wie, że zapasy są mniejsze niż mówią liderzy");
            case "horror" -> List.of("Widział pierwszy dowód i go ukrył", "Pamięta rytuał, ale jako sen", "Wie, który świadek kłamie", "Znalazł rzecz, która nie mogła istnieć", "Słyszy nocą głos osoby uznanej za martwą");
            default -> asList(pool.get("secrets"));
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

    private boolean booleanParam(Map<String, Object> params, String key, boolean fallback) {
        Object value = params.get(key);
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value != null && !String.valueOf(value).isBlank()) {
            return Boolean.parseBoolean(String.valueOf(value));
        }
        return fallback;
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return picked == null ? "" : String.valueOf(picked);
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

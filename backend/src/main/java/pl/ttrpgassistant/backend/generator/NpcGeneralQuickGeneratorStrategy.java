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
        sections.add(section("Wygląd", appearance + ". Ma jeden charakterystyczny detal, który łatwo zapamietac przy stole."));
        sections.add(section("Osobowość", personality + ". " + motivation + "."));

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
            case "postapo" -> pick(List.of("Kruk", "Mila", "Stary Borys", "Igla", "Mechanik Zero", "Sucha", "Rafa", "Cichy Jan", "Matka Ruta", "Sep"));
            case "horror" -> pick(List.of("Elena Ward", "Marek Voss", "Siostra Irena", "Oskar Feld", "Helena Nort", "Jan Rudzki", "Marta Koss", "Antoni Hale", "Roza Stein", "Wiktor Lenz"));
            case "realistyczny" -> pick(List.of("Anna Kowal", "Marek Lis", "Irena Nowak", "Tomasz Ward", "Helena Koss", "Piotr Wrona", "Alicja Marzec", "Nina Sowa", "Karol Bien", "Ewa Krol"));
            default -> pick(asList(pool.get("givenNames"))) + " " + pick(asList(pool.get("familyNames")));
        };
    }

    private String raceFor(String setting) {
        if (!"fantasy".equals(normalize(setting))) {
            return "";
        }
        return pick(List.of(
                "Czlowiek", "Elf", "Krasnolud", "Niziolek", "Gnom", "Polelf", "Polork", "Tiefling",
                "Smocze dziecie", "Aasimar", "Goblin", "Ork", "Kobold", "Lesny duch w ludzkiej skórze"
        ));
    }

    private String motifFor(Map<String, Object> params, String setting) {
        String requested = stringParam(params, "motif", "Losowy");
        List<String> motifs = switch (normalize(setting)) {
            case "fantasy" -> List.of("Dług", "Zakazana magia", "Rodzina", "Zdrada", "Ambicja", "Relikwia", "Zemsta", "Przysiega", "Ucieczka", "Tajemnica rodu");
            case "horror" -> List.of("Wina", "Obsesja", "Zaginiona osoba", "Koszmar", "Milczenie", "Kult", "Falsżywe wspomnienie", "Zakazany dowod", "Strach przed domem", "Niechciane dziedzictwo");
            case "sci-fi", "scifi" -> List.of("Kontrakt", "Dane", "Implant", "Dezercja", "Dług korporacyjny", "Fałszywa tożsamość", "Awaria", "Zakazana technologia", "Misja ratunkowa", "Ucieczka z kolonii");
            case "postapo" -> List.of("Przetrwanie", "Woda", "Leki", "Rodzina", "Utracone schronienie", "Wina ocalalego", "Stary szlak", "Glod", "Bezpieczna zima", "Zdradzona osada");
            default -> List.of("Kariera", "Sekret", "Dług", "Rodzina", "Ambicja", "Strach", "Uklad", "Znikniecie", "Reputacja", "Ostatnia szansa");
        };
        if (!randomChoice(requested) && motifs.stream().anyMatch(motif -> normalize(motif).equals(normalize(requested)))) {
            return requested;
        }
        return pick(motifs);
    }

    private List<?> rolesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pilot", "Mechanik", "Medyk", "Najemnik", "Analityk", "Przemytnik", "Oficer stacji", "Haker", "Dyplomata", "Inzynier napedu", "Kurier orbitalny", "Lowca danych");
            case "postapo" -> List.of("Ocalały", "Lider osady", "Szabrownik", "Medyk", "Łowca zasobów", "Strażnik bramy", "Handlarz wodą", "Zwiadowca", "Mechanik", "Kucharz osady", "Kaznodzieja", "Były żołnierz");
            case "horror" -> List.of("Śledczy", "Świadek", "Podejrzany", "Lekarz", "Bibliotekarz", "Okultysta", "Dziennikarz", "Ksiądz", "Dozorca", "Fotograf", "Patolog", "Archiwistka");
            case "realistyczny" -> List.of("Dzieńnikarz", "Policjant", "Lekarz", "Prawnik", "Kierowca", "Urzednik", "Naucżyciel", "Ochroniarz", "Recepcjonistka", "Technik", "Sasiad", "Właściciel baru");
            default -> asList(pool.get("roles"));
        };
    }

    private String appearanceFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> pick(List.of(
                    "Nosi zuzyty kombinezon z niezgodnymi oznaczeniami i implant przy skroni",
                    "Ma spokojny głos, oczy po korekcji optycznej i narzedzia przypiete do pasa",
                    "Wygląda jak ktoś, kto od dawna sypia w fotelu pilota",
                    "Ma rekawice serwisowe, ślady po oparzeniach i zbyt czysty identyfikator"
            ));
            case "postapo" -> pick(List.of(
                    "Nosi warstwowe ubrania, prowizoryczny pancerz i plecąk naprawiany drutem",
                    "Liczy wyjscia z pomieszczenia, zanim zacznie rozmowe",
                    "Trzyma najcenniejszy przedmiot blisko ciala i nie odwraca sie plecąmi",
                    "Ma maske przeciwpyłowa na szyi, nawet kiedy powietrze wygląda czysto"
            ));
            case "horror" -> pick(List.of(
                    "Wygląda zwyczajnie, ale ręce zdradzaja wiele nieprzespanych nocy",
                    "Mowi cicho, unika luster i reaguje za szybko na jedno slowo",
                    "Elegancki ubior psuje zapach wilgoći, lekow albo starego papieru",
                    "Nosi przy sobie notatnik zapisany tym samym zdaniem"
            ));
            case "realistyczny" -> pick(List.of(
                    "Ma zmeczona twarz, praktyczne ubranie i ruchy kogos stalego w rutynie",
                    "Wygląda na osobe, która wie więcej niż powinna mowic",
                    "Jest uprzejmy, ale obserwuje rozmowce zanim odpowie",
                    "Ma telefon z peknietym ekranem i kieszenie pełne paragonow"
            ));
            default -> pick(List.of(
                    "Ma znoszony płaszcz, czujne spojrzenie i ręce przyzwyczajone do pracy",
                    "Nosi prosty stroj z jednym zbyt drogim dodatkiem",
                    "Porusza sie ostroznie, jakby sluchal czegoś za sciana",
                    "Wygląda na osobe, która przyszla tu w konkretnym celu"
            ));
        };
    }
    private List<?> personalitiesFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Pragmatyczny i precyzyjny", "Sarkastyczny, ale lojalny po podpisaniu umowy", "Nerwowy, gdy systemy milcza", "Zbyt spokojny pod ostrzalem", "Ufa procedurom bardziej niż ludziom");
            case "postapo" -> List.of("Nieufny, konkretny i oszczedny w slowach", "Pomaga, ale zawsze liczy koszt", "Twardy na pokaz, zmeczony pod spodem", "Smieje sie tylko wtedy, gdy sytuacja robi sie zla", "Nie lubi obietnic bez zaplaty z gory");
            case "horror" -> List.of("Uprzejmy, lecz bliski zalamania", "Racjonalizuje rzeczy, których juz nie umie wyjasnic", "Zbyt spokojny jak na to, co widzial", "Wciaz poprawia jeden detal ubrania", "Odpowiada tak, jakby ktoś go podsluchiwal");
            default -> asList(pool.get("personalities"));
        };
    }

    private List<?> motivationsFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "sci-fi", "scifi" -> List.of("Chce spłacić kontrakt zanim ktoś sprawdzi jego prawdziwe dane", "Szuka dostępu do systemu, który może go oczyścić", "Chroni załogę przed informacją, która rozbiłaby misje", "Potrzebuje części, której nie wolno kupić legalnie", "Próbuje ukryć błąd, który może kosztowac życie");
            case "postapo" -> List.of("Potrzebuje lekow dla kogos z osady", "Chce znalezc bezpieczne miejsce zanim zima zamknie drogi", "Ukrywa zasob, który może wywolac konflikt", "Szuka osoby zabranej przez inna grupe", "Chce odzyskac mape, zanim trafi w zle ręce");
            case "horror" -> List.of("Chce udowodnic, ze to nadal ma racjonalne wyjasnienie", "Szuka osoby, która zniknela po tej samej wskazowce", "Próbuje naprawic błąd sprzed lat", "Chroni kogos, kto może byc winny", "Chce opuscic miasto, ale boi sie drogi");
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




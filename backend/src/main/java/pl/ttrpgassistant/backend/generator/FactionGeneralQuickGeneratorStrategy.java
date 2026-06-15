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
public class FactionGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public FactionGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "faction".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String setting = setting(params);
        String requestedType = stringParam(params, "factionType", "Losowy");
        String scale = stringParam(params, "scale", "Lokalna");
        String type = resólveType(setting, requestedType);
        String name = organizationName(setting, type, pool);

        List<GeneratorOutputSection> sections = List.of(
                section("Cel", goalFor(setting) + "."),
                section("Metody", methodFor(setting) + "."),
                section("Zasoby", resourceFor(setting, pool) + "."),
                section("Sekret", secretFor(setting, pool) + "."),
                section("Konflikt", conflictFor(setting) + ".")
        );

        return new GeneratorStructuredResultResponse(
                null,
                "faction",
                "general.quick",
                name,
                setting + " | " + scale + " | " + type,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("faction", "any", "general.quick")
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

    private String resólveType(String setting, String requestedType) {
        List<String> types = typesFor(setting);
        if (randomChoice(requestedType) || types.stream().noneMatch(type -> type.equalsIgnoreCase(requestedType))) {
            return pick(types);
        }
        return requestedType;
    }

    private List<String> typesFor(String setting) {
        return switch (normalize(setting)) {
            case "fantasy" -> List.of("Gildia", "Zakon", "Rada miejska", "Kult", "Kompania najemna", "Cech", "Bractwo", "Ród", "Krąg magów", "Straż świątynna", "Liga kupiecka", "Tajna loża");
            case "horror" -> List.of("Kult", "Towarzystwo okultystyczne", "Fundacja", "Krąg badaczy", "Rodzina wpływów", "Komitet parafialny", "Sanatorium", "Klub kolekcjonerów", "Sekta domowa", "Archiwum prywatne");
            case "sci-fi", "scifi" -> List.of("Korporacja", "Załoga", "Agencja", "Kartel", "Konsorcjum", "Ruch oporu", "Klan orbitalny", "Syndykat danych", "Flota najemna", "Kult maszyn", "Rada kolonii");
            case "postapo" -> List.of("Osada", "Banda", "Karawana", "Milicja", "Klan", "Syndykat zasobów", "Radio-wspólnota", "Zakon wody", "Mechanicy", "Straż mostu", "Handlarze leków");
            default -> List.of("Stowarzyszenie", "Firma", "Komitet", "Ruch społeczny", "Sieć kontaktów", "Fundacja", "Spółdzielnia", "Klub", "Związek zawodowy", "Grupa sąsiedzka");
        };
    }

    private String organizationName(String setting, String type, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "fantasy" -> type + " " + pick("Srebrnej Bramy", "Zielonego Traktu", "Trzech Pieczęci", "Cichego Młota", "Białej Latarni", "Żelaznego Klucza", "Ostatniej Przysięgi");
            case "horror" -> type + " " + pick("Pustej Sali", "Czarnego Archiwum", "Ostatniej Świecy", "Domu bez Dat", "Siedmiu Fotografii", "Ślepego Okna", "Cichego Pogrzebu");
            case "sci-fi", "scifi" -> pick("Helix", "Vantage", "Orion", "Kestrel", "Aster", "Nexodyne", "Cyrkon", "Blue Meridian") + " " + type;
            case "postapo" -> type + " " + pick("przy Starym Moście", "Sektóra B", "Żelaznej Studni", "Trasy Północnej", "Czerwonego Masztu", "Suchych Zbiorników", "Tunelu 9");
            default -> type + " " + pick(asList(pool.get("adjectives"))) + " " + pick(asList(pool.get("nouns")));
        };
    }

    private String goalFor(String setting) {
        return switch (normalize(setting)) {
            case "fantasy" -> pick("przejąć kontrolę nad szlakiem, relikwią albo lokalnym prawem", "utrzymać monopol na usługę, której wszyscy potrzebują", "obalić rywala bez otwartej wojny", "zabezpieczyć starą przysięgę przed ujawnieniem", "zdobyć patronat świątyni albo dworu");
            case "horror" -> pick("ukryć prawdę przed ludźmi, którzy nie są gotowi", "dokończyć rytuał zanim śledztwo stanie się publiczne", "zatrzymać świadka zanim zacznie mówić", "utrzymać pozory normalności za wszelką cenę", "odzyskać przedmiot z akt policyjnych");
            case "sci-fi", "scifi" -> pick("zabezpieczyć dane, technologię albo kontrakt", "wyprzedzić konkurencję zanim sprawa trafi do rejestru", "przejąć kontrolę nad portem lub pasmem komunikacji", "ukryć awarię przed audytem", "wykupić albo zniszczyć niewygodny patent");
            case "postapo" -> pick("utrzymać dostęp do wody, leków albo paliwa", "przetrwać zimę kosztem cudzych zapasów", "otwórzyć bezpieczny szlak przez ruiny", "przejąć studnię bez rozpętania wojny", "zatrzymać ludzi, którzy chcą odejść");
            default -> pick("zdobyć wpływ bez oficjalnego konfliktu", "kontrolować informację zanim stanie się problemem", "przejąć decyzję komitetu", "zamknąć sprawę zanim wejdą media", "zabezpieczyć finansowanie kosztem reputacji");
        };
    }

    private String methodFor(String setting) {
        return switch (normalize(setting)) {
            case "fantasy" -> pick("długi, przysięgi, listy polecąjące i ciche groźby", "pośrednicy, fałsżywe zlecenia i patronat nad biedniejszymi", "kontrola cechowych pieczęci i dostępu do pracy", "małe cuda pokazywane właściwym ludziom", "ochrona karawan w zamian za lojalność");
            case "horror" -> pick("zacieranie śladów, presja społeczna i pozornie zwykłe przysługi", "izolowanie świadków oraz niszczenie dokumentów", "terapia, spowiedź albo ankiety użyte jako źródło szantażu", "wspólne milczenie ważnych rodzin", "anonimowe listy i znikające fotografie");
            case "sci-fi", "scifi" -> pick("kontrakty, blokady dostępu i manipulacja logami", "wynajęci specjaliści oraz automatyczne procedury prawne", "drony, fałsżywe identyfikatory i opóźnienia w systemach", "przejmowanie serwisu zamiast walki", "kupowanie długu załóg");
            case "postapo" -> pick("kontrola szlaków, racji i bezpiecznych noclegów", "zastraszanie, handel ochroną i pokazowe kary", "dystrybucja filtrów, amunicji i lekarstw", "blokady mostów i fałsżywe alarmy", "małżeństwa, zakładnicy i wymiana przysług");
            default -> pick("sieć przysług, naciski finansowe i kontrola reputacji", "oficjalne procedury użyte do nieoficjalnych celów", "spotkania poza protokołem", "kontrola dostępu do dokumentów", "tworzenie problemu, a potem sprzedawanie rozwiązania");
        };
    }

    private String resourceFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "fantasy" -> pick("informatorzy w karczmach i dostęp do starych pieczęci", "magazyn broni, konie i skryba od dokumentów", "bezpieczne kryjówki przy trakcie", "dłużnicy wśród rzemieślników", "relikwia, której nikt nie pokazuje publicznie");
            case "horror" -> pick("archiwum, wpływowi darczyńcy i ktoś w policji", "dom spotkań, stare księgi i lekarz bez pytań", "lista pacjentów albo parafian", "klucze do zamkniętej części szpitala", "człowiek od znikających akt");
            case "sci-fi", "scifi" -> pick("dostęp do portu, fałsżywe identyfikatory i prywatne drony", "serwer z danymi oraz zespół od czyszczenia śladów", "kontrakty serwisowe na kilku stacjach", "własny kanał komunikacji poza rejestrem", "magazyn części i ludzi od brudnej roboty");
            case "postapo" -> pick("studnia, warsztat i ludzie znający teren", "zapas paliwa, radio i kilku uzbrojonych strażników", "mapy bezpiecznych przejść", "stara karetka i zapas antybiotyków", "wieża obserwacyjna oraz sygnał dymny");
            default -> pick(asList(pool.get("resources")));
        };
    }

    private String secretFor(String setting, Map<String, Object> pool) {
        return switch (normalize(setting)) {
            case "fantasy" -> pick("lider działa na rzecz konkurencyjnej siły", "ich patronat opiera się na sfałszowanym prawie", "największy wróg jest ich dawnym założycielem", "przysięga chroniąca organiżację właśnie wygasa", "członkowie ukrywają nieudaną próbę zamachu");
            case "horror" -> pick("organiżacja jest podzielona i bliska paniki", "ich rytuał już raz się nie udał", "prawdziwy lider jest oficjalnie martwy", "jeden z członków próbuje zostawić wskazówki", "nie wiedzą, że służą czemuś innemu");
            case "sci-fi", "scifi" -> pick("główna baza nie istnieje w oficjalnych mapach", "AI albo audytor zna prawdziwy cel operacji", "zarząd ukrywa obcy sygnał w danych finansowych", "ich najlepszy agent jest kopią", "kontrakt został podpisany po dacie katastrofy");
            case "postapo" -> pick("najważniejszy zasób kończy się szybciej niż mówią", "ktoś sprzedał trasę wrogiej grupie", "lider nie ma już kontroli nad strażą", "filtr wody działa tylko dzięki części niemożliwej do zastąpienia", "ich święta zasada została złamana");
            default -> pick(asList(pool.get("secrets")));
        };
    }

    private String conflictFor(String setting) {
        return switch (normalize(setting)) {
            case "fantasy" -> "ich oferta pomoże drużynie, ale wciągnie ją w lokalny układ";
            case "horror" -> "pomoc organiżacji wygląda rozsądnie, dopóki gracze nie zobaczą ceny ciszy";
            case "sci-fi", "scifi" -> "kontrakt jest legalny, lecz jego prawdziwy cel szkodzi komuś poza kadrem";
            case "postapo" -> "każda współpraca oznacza wybór, komu zabraknie zasobów";
            default -> "organiżacja ma coś użytecznego, ale chce za to realnej przysługi";
        };
    }

    private boolean randomChoice(String value) {
        String normalized = value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return GeneratorTextSanitizer.clean(picked);
    }

    private String pick(String... values) {
        if (values == null || values.length == 0) return "";
        return GeneratorTextSanitizer.clean(values[random.nextInt(values.length)]);
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }
}

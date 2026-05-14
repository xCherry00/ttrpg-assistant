package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class HookGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final GeneratorPoolRepository poolRepository;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public HookGeneralQuickGeneratorStrategy(GeneratorPoolRepository poolRepository, ObjectMapper objectMapper) {
        this.poolRepository = poolRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "hook".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        Map<String, Object> pool = readPool();
        String setting = setting(params);
        String kind = stringParam(params, "mood", "Losowy");
        Map<String, Object> entry = pickEntry(pool, kind);

        List<GeneratorOutputSection> sections = List.of(
                section("Problem", problemFor(setting, entry)),
                section("Dziwny detal", detailFor(setting, entry)),
                section("Komplikacja", complicationFor(setting)),
                section("Wskazówka", leadFor(setting, entry))
        );

        return new GeneratorStructuredResultResponse(
                null,
                "hook",
                "general.quick",
                "Przygoda: " + displayKind(kind, entry),
                setting + " | " + value(entry, "scale"),
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private String setting(Map<String, Object> params) {
        String requested = stringParam(params, "setting", "Losowy");
        return randomChoice(requested)
                ? pick(List.of("Fantasy", "Horror", "Sci-Fi", "Postapo", "Realistyczny"))
                : requested;
    }

    private String displayKind(String requested, Map<String, Object> entry) {
        return randomChoice(requested) ? value(entry, "mood") : requested;
    }

    private String problemFor(String setting, Map<String, Object> entry) {
        String base = value(entry, "situation");
        return switch (looseKey(setting)) {
            case "fantasy" -> base + " W tle jest lokalna przysięga, dług albo naruszony trakt.";
            case "horror" -> base + " Oficjalne wyjaśnienie brzmi logicznie, ale nie pasuje do jednego śladu.";
            case "sci-fi", "scifi" -> base + " Dane, kontrakt albo logi pokazują inną wersję zdarzeń.";
            case "postapo" -> base + " Stawka jest prosta: zasoby, bezpieczeństwo albo droga odwrotu.";
            default -> base;
        };
    }

    private String detailFor(String setting, Map<String, Object> entry) {
        String base = value(entry, "detail");
        return switch (looseKey(setting)) {
            case "fantasy" -> base + " Symbol wygląda na starszy niż okolica.";
            case "horror" -> base + " Ktoś bardzo chce, żeby uznano to za przypadek.";
            case "sci-fi", "scifi" -> base + " Jeden odczyt ma niemożliwy znacznik czasu.";
            case "postapo" -> base + " Ślad prowadzi do miejsca, gdzie nikt rozsądny nie nocuje.";
            default -> base;
        };
    }

    private String complicationFor(String setting) {
        return switch (looseKey(setting)) {
            case "fantasy" -> pick(List.of("Patron zna winnego, ale nie może oskarżyć go publicznie.", "Nagroda należy do kogoś, kto jeszcze się po nią zgłosi.", "Stary sojusznik prosi, by drużyna zataiła część prawdy.", "Rozwiązanie problemu złamie lokalne prawo.", "Jedna frakcja chce pomóc tylko po to, by przejąć zasługę."));
            case "horror" -> pick(List.of("Pierwszy świadek kłamie, żeby kogoś chronić.", "Każda zwłoka sprawia, że kolejny dowód znika.", "Policja uznaje sprawę za zamkniętą zbyt szybko.", "Najbardziej pomocna osoba boi się wejść do kluczowego miejsca.", "Dowód zmienia znaczenie po zmroku."));
            case "sci-fi", "scifi" -> pick(List.of("Zleceniodawca zmienia warunki po starcie misji.", "Druga załoga ma ten sam cel i inne rozkazy.", "AI odmawia wykonania jednego legalnego polecenia.", "Nagroda zależy od skasowania niewygodnych danych.", "Cel misji ma własną wersję kontraktu."));
            case "postapo" -> pick(List.of("Pomoc jednej grupie odbierze zasoby drugiej.", "Najkrótsza droga jest kontrolowana przez ludzi, którzy chcą zapłaty z góry.", "Zapasy istnieją, ale są skażone albo oznaczone cudzym symbolem.", "Ktoś śledzi drużynę od pierwszego postoju.", "Rozwiązanie problemu może zniszczyć kruche porozumienie."));
            default -> pick(List.of("Ktoś z lokalnych wie więcej, ale boi się powiedzieć to publicznie.", "Pierwszy trop prowadzi do osoby, która sama jest ofiarą większego planu.", "Najprostsze rozwiązanie krzywdzi kogoś niewinnego.", "Ktoś oferuje pomoc dokładnie wtedy, gdy robi się zbyt wygodnie."));
        };
    }

    private String leadFor(String setting, Map<String, Object> entry) {
        String lead = value(entry, "lead");
        return switch (looseKey(setting)) {
            case "fantasy" -> lead + " Zacznij od herbu, plotki albo świadka na targu.";
            case "horror" -> lead + " Zacznij od niezgodności w relacji świadka.";
            case "sci-fi", "scifi" -> lead + " Zacznij od błędu w logach albo skasowanego nagrania.";
            case "postapo" -> lead + " Zacznij od śladu przy zasobie, którego brakuje.";
            default -> lead;
        };
    }

    private Map<String, Object> pickEntry(Map<String, Object> pool, String mood) {
        List<Object> entries = asList(pool.get("entries"));
        if (!randomChoice(mood)) {
            String wanted = looseKey(mood);
            return entries.stream()
                    .map(this::asMap)
                    .filter(entry -> looseKey(String.valueOf(entry.get("mood"))).equals(wanted))
                    .findAny()
                    .orElseGet(() -> asMap(pickObject(entries)));
        }
        return asMap(pickObject(entries));
    }

    private Map<String, Object> readPool() {
        GeneratorPoolEntity entity = poolRepository
                .findByGeneratorTypeAndSystemCodeAndSubtype("hook", "any", "default")
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

    private String value(Map<String, Object> entry, String key) {
        Object value = entry.get(key);
        return GeneratorTextSanitizer.clean(value);
    }

    private boolean randomChoice(String value) {
        String normalized = looseKey(value);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String pick(List<?> list) {
        if (list == null || list.isEmpty()) return "";
        Object picked = list.get(random.nextInt(list.size()));
        return GeneratorTextSanitizer.clean(picked);
    }

    private Object pickObject(List<?> list) {
        if (list == null || list.isEmpty()) return Map.of();
        return list.get(random.nextInt(list.size()));
    }

    private List<Object> asList(Object value) {
        if (value instanceof List<?> list) {
            return new ArrayList<>(list);
        }
        return List.of();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private String looseKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }
}

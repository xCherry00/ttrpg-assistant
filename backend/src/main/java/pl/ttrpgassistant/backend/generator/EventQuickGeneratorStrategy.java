package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Component
public class EventQuickGeneratorStrategy implements GeneratorStrategy {
    private static final String GENERATOR = "event_quick";
    private static final String VARIANT = "general.quick";
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return GENERATOR.equals(generatorCode) && VARIANT.equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String eventType = resolveEventType(stringParam(params, "eventType", "Losowy"));
        String eventMood = resolveEventMood(stringParam(params, "eventMood", "Losowy"));

        List<GeneratorOutputSection> sections = eventFor(eventType, eventMood);

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, "Wydarzenie: " + eventType, eventType + " | " + eventMood, sections, "seed", OffsetDateTime.now()
        );
    }

    private String resolveEventType(String eventType) {
        if (!randomChoice(eventType)) {
            return eventType;
        }
        return pick(List.of("Miasto", "Las", "Pustynia", "Morze", "Nocna warta"));
    }

    private String resolveEventMood(String eventMood) {
        if (!randomChoice(eventMood)) {
            return eventMood;
        }
        return pick(List.of("Dobre", "Neutralne", "Zle", "Dziwne", "Niebezpieczne"));
    }

    private List<GeneratorOutputSection> eventFor(String eventType, String eventMood) {
        String key = normalize(eventType);
        List<GeneratorOutputSection> base = switch (key) {
            case "miasto", "town", "city" -> withConsequence(
                    "Na targu wybucha klotnia miedzy cechem a straznikami o skonfiskowany towar.",
                    "Handel staje, a jedna strona szuka swiadkow na swoja wersje wydarzen."
            );
            case "las", "forest" -> withConsequence(
                    "Na szlaku pojawia sie porzucony woz z zaprzegiem, ale bez ludzi.",
                    "W poblizu krazy cos, co odstraszylo konie i porywaczy."
            );
            case "pustynia", "desert" -> withConsequence(
                    "Burza piaskowa odslania kamienne wejscie do starej komory.",
                    "Okno na eksploracje jest krotkie, nim wejscie znow zasypie."
            );
            case "morze", "sea" -> withConsequence(
                    "Na horyzoncie dryfuje statek z niepokojaco cichym pokladem.",
                    "Jesli go minac, okazja i trop przepadna."
            );
            case "nocna warta", "on watch", "watch" -> withConsequence(
                    "W nocy ktos zostawia znak ostrzegawczy przy obozie.",
                    "Rano okazuje sie, ze druzyna byla obserwowana od zmierzchu."
            );
            default -> withConsequence(
                    "W poblizu dzieje sie cos, co wciaga postacie w cudzy problem.",
                    "Brak reakcji takze bedzie decyzja z konsekwencja."
            );
        };
        return List.of(section("Rodzaj", eventMood), base.get(0), base.get(1));
    }

    private List<GeneratorOutputSection> withConsequence(String event, String consequence) {
        return List.of(section("Wydarzenie", event), section("Skutek", consequence));
    }

    private String pick(List<String> values) {
        return values.get(random.nextInt(values.size()));
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private boolean randomChoice(String value) {
        String normalized = normalize(value);
        return normalized.equals("losowy") || normalized.equals("losowa") || normalized.equals("random");
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase().trim();
    }
}

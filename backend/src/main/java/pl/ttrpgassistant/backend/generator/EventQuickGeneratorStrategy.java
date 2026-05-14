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
        String eventType = stringParam(params, "eventType", "Losowy");

        List<GeneratorOutputSection> sections = randomChoice(eventType)
                ? randomEvent()
                : eventFor(eventType);

        return new GeneratorStructuredResultResponse(
                null, GENERATOR, VARIANT, "Wydarzenie", "Szybkie wydarzenie zalezne od miejsca", sections, "seed", OffsetDateTime.now()
        );
    }

    private List<GeneratorOutputSection> randomEvent() {
        return switch (random.nextInt(5)) {
            case 0 -> eventFor("Miasto");
            case 1 -> eventFor("Las");
            case 2 -> eventFor("Pustynia");
            case 3 -> eventFor("Morze");
            default -> eventFor("Nocna warta");
        };
    }

    private List<GeneratorOutputSection> eventFor(String eventType) {
        String key = normalize(eventType);
        return switch (key) {
            case "miasto", "town", "city" -> withOptionalConsequence(
                    "Na targu wybucha klotnia miedzy cechem a straznikami o skonfiskowany towar.",
                    "Handel staje, a jedna strona szuka swiadkow na swoja wersje wydarzen."
            );
            case "las", "forest" -> withOptionalConsequence(
                    "Na szlaku pojawia sie porzucony woz z zaprzegiem, ale bez ludzi.",
                    "W poblizu krazy cos, co odstraszylo konie i porywaczy."
            );
            case "pustynia", "desert" -> withOptionalConsequence(
                    "Burza piaskowa odslania kamienne wejscie do starej komory.",
                    "Okno na eksploracje jest krotkie, nim wejscie znow zasypie."
            );
            case "morze", "sea" -> withOptionalConsequence(
                    "Na horyzoncie dryfuje statek z niepokojaco cichym pokladem.",
                    "Jesli go minac, okazja i trop przepadna."
            );
            case "nocna warta", "on watch", "watch" -> withOptionalConsequence(
                    "W nocy ktos zostawia znak ostrzegawczy przy obozie.",
                    "Rano okazuje sie, ze druzyna byla obserwowana od zmierzchu."
            );
            default -> withOptionalConsequence(
                    "W poblizu dzieje sie cos, co wciaga postacie w cudzy problem.",
                    "Brak reakcji takze bedzie decyzja z konsekwencja."
            );
        };
    }

    private List<GeneratorOutputSection> withOptionalConsequence(String event, String consequence) {
        if (random.nextBoolean()) {
            return List.of(section("Wydarzenie", event), section("Skutek", consequence));
        }
        return List.of(section("Wydarzenie", event));
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


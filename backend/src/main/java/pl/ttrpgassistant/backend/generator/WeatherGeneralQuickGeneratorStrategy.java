package pl.ttrpgassistant.backend.generator;

import org.springframework.stereotype.Component;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Component
public class WeatherGeneralQuickGeneratorStrategy implements GeneratorStrategy {
    private final Random random = new Random();

    @Override
    public boolean supports(String generatorCode, String variantCode) {
        return "weather".equals(generatorCode) && "general.quick".equals(variantCode);
    }

    @Override
    public GeneratorStructuredResultResponse generate(GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        String climate = normalizeChoice(stringParam(params, "climate", "Umiarkowany"), List.of("Umiarkowany", "Tropikalny", "Suchy", "Zimny", "Górski", "Nadmorski", "Bagienny"));
        String season = normalizeChoice(stringParam(params, "season", "Wiosna"), List.of("Wiosna", "Lato", "Jesień", "Zima"));
        WeatherRoll roll = rollWeather(climate, season);

        List<GeneratorOutputSection> sections = List.of(
                section("Opis", roll.description()),
                section("Warunki", "Temperatura: " + roll.lowC() + " do " + roll.highC() + "°C. Wiatr: " + roll.windForce() + ", " + roll.windSpeedKmh() + " km/h."),
                section("Przy stole", roll.tableUse())
        );

        return new GeneratorStructuredResultResponse(
                null,
                "weather",
                "general.quick",
                capitalize(roll.description()),
                climate + " - " + season,
                sections,
                "seed",
                OffsetDateTime.now()
        );
    }

    private String capitalize(String value) {
        if (value == null || value.isBlank()) return "Pogoda";
        String cleaned = GeneratorTextSanitizer.clean(value).trim();
        return cleaned.substring(0, 1).toUpperCase(Locale.ROOT) + cleaned.substring(1);
    }

    private WeatherRoll rollWeather(String climate, String season) {
        int base = baseTemperature(climate, season);
        int variation = random.nextInt(11) - 5;
        int high = base + variation + random.nextInt(5);
        int low = high - (6 + random.nextInt(9));
        int relativeShift = variation + random.nextInt(9) - 4;
        String relative = relativeShift <= -5 ? "chłodniej niż zwykle" : relativeShift >= 5 ? "cieplej niż zwykle" : "w normie";
        WindRoll wind = wind();
        String description = description(climate, season, wind);
        return new WeatherRoll(description, relative, high, low, wind.force(), wind.speedKmh(), tableUse(description, wind));
    }

    private int baseTemperature(String climate, String season) {
        int seasonal = switch (season) {
            case "Lato" -> 10;
            case "Jesień" -> -2;
            case "Zima" -> -12;
            default -> 0;
        };
        int climateBase = switch (climate) {
            case "Tropikalny" -> 27;
            case "Suchy" -> 24;
            case "Zimny" -> 2;
            case "Górski" -> 8;
            case "Nadmorski" -> 12;
            case "Bagienny" -> 15;
            default -> 13;
        };
        return climateBase + seasonal;
    }

    private String description(String climate, String season, WindRoll wind) {
        if (wind.speedKmh() >= 55) {
            return pick(List.of("silny wiatr i rwane chmury", "porywisty wiatr pod czystym niebem", "gwałtowne podmuchy i zmienna widoczność", "ostry wiatr niosący pył i drobne śmieci"));
        }
        if (wind.speedKmh() >= 35) {
            return pick(List.of("wietrznie i sucho", "chmury przesuwane silniejszym wiatrem", "jasno, ale wyraźnie wietrznie", "zimniejsze podmuchy między krótkimi przejaśnieniami"));
        }
        List<String> clear = List.of("bezchmurnie", "częściowe zachmurzenie", "jasno i sucho", "cienkie chmury", "blade słońce", "suchy poranek");
        List<String> wet = List.of("lekki deszcz", "ciężkie chmury", "przelotne opady", "wilgotno i pochmurno", "niska mgła po deszczu", "mżawka i błoto");
        List<String> harsh = List.of("zimna mgła", "przelotny śnieg", "mroźny wiatr", "niskie szare niebo", "szron i śliska droga", "mokry śnieg");
        if ("Zima".equals(season) || "Zimny".equals(climate)) return pick(harsh);
        if ("Tropikalny".equals(climate) && random.nextBoolean()) {
            return pick(List.of("ciepły deszcz", "wilgotne chmury", "nagła ulewa", "parna mgiełka", "duszne powietrze przed burzą"));
        }
        if ("Suchy".equals(climate)) {
            return pick(List.of("bezchmurnie", "suchy upał", "pylisty wiatr", "blade niebo", "gorący wiatr i kurz"));
        }
        if ("Nadmorski".equals(climate)) {
            return pick(List.of("wilgotny wiatr od wody", "niskie chmury nad wybrzeżem", "słona mgła", "krótkie przejaśnienia i chłodny wiatr"));
        }
        if ("Bagienny".equals(climate)) {
            return pick(List.of("ciężka mgła i mokre powietrze", "lepka wilgoć", "ciepła mżawka", "nisko wiszące chmury nad mokradłami"));
        }
        return random.nextBoolean() ? pick(clear) : pick(wet);
    }

    private String tableUse(String description, WindRoll wind) {
        if (wind.speedKmh() >= 55) {
            return "Hałas i podmuchy utrudniają rozmowę, tropienie oraz strzały na dystans.";
        }
        if (description.contains("mgła") || description.contains("chmury")) {
            return "Widoczność jest gorsza; dobre na zasadzki, skradanie i niepewne podróże.";
        }
        if (description.contains("deszcz") || description.contains("mżawka") || description.contains("śnieg")) {
            return "Droga robi się wolniejsza, ślady mogą się zacierać, a ogień trudniej utrzymać.";
        }
        return "Warunki są czytelne i lekkie; użyj pogody jako tła, nie przeszkody.";
    }

    private WindRoll wind() {
        int roll = random.nextInt(100);
        if (roll < 30) return new WindRoll("cisza", random.nextInt(5));
        if (roll < 68) return new WindRoll("lekki", 6 + random.nextInt(12));
        if (roll < 90) return new WindRoll("umiarkowany", 18 + random.nextInt(17));
        if (roll < 98) return new WindRoll("silny", 35 + random.nextInt(20));
        return new WindRoll("gwałtowny", 55 + random.nextInt(28));
    }

    private GeneratorOutputSection section(String title, String content) {
        return new GeneratorOutputSection("text", title, content, List.of());
    }

    private String normalizeChoice(String value, List<String> allowed) {
        if (randomChoice(value)) {
            return pick(allowed);
        }
        String wanted = translateChoice(looseKey(value));
        return allowed.stream()
                .filter(option -> looseKey(option).equals(wanted))
                .findFirst()
                .orElse(allowed.get(0));
    }

    private String translateChoice(String value) {
        return switch (value) {
            case "temperate" -> "umiarkowany";
            case "tropical" -> "tropikalny";
            case "arid" -> "suchy";
            case "cold" -> "zimny";
            case "mountain" -> "gorski";
            case "coastal" -> "nadmorski";
            case "swamp" -> "bagienny";
            case "spring" -> "wiosna";
            case "summer" -> "lato";
            case "autumn", "fall" -> "jesien";
            case "winter" -> "zima";
            default -> value;
        };
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
        return GeneratorTextSanitizer.clean(list.get(random.nextInt(list.size())));
    }

    private String looseKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).trim();
    }

    private record WeatherRoll(String description, String relative, int highC, int lowC, String windForce, int windSpeedKmh, String tableUse) {}
    private record WindRoll(String force, int speedKmh) {}
}

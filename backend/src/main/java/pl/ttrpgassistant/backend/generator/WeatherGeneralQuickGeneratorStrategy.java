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
        if (usesExpandedWeatherPools()) {
            return expandedDescription(climate, season, wind);
        }
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

    private boolean usesExpandedWeatherPools() {
        return true;
    }

    private String expandedDescription(String climate, String season, WindRoll wind) {
        if (wind.speedKmh() >= 55) return pick(windyStormDescriptions());
        if (wind.speedKmh() >= 35) return pick(windyDescriptions());
        if ("Zima".equals(season) || "Zimny".equals(climate)) return pick(harshDescriptions());
        if ("Tropikalny".equals(climate) && random.nextBoolean()) return pick(tropicalDescriptions());
        if ("Suchy".equals(climate)) return pick(aridDescriptions());
        if ("Nadmorski".equals(climate)) return pick(coastalDescriptions());
        if ("Bagienny".equals(climate)) return pick(swampDescriptions());
        return random.nextBoolean() ? pick(clearDescriptions()) : pick(wetDescriptions());
    }

    private List<String> windyStormDescriptions() {
        return List.of("silny wiatr i rwane chmury", "porywisty wiatr pod czystym niebem", "gwaltowne podmuchy i zmienna widocznosc", "ostry wiatr niosacy pyl i drobne smieci", "wiatr szarpiacy plaszczami i latarniami", "ciemne chmury pedzone szybciej niz zwykle", "suche galezie trzaskaja pod naporem wichru", "zimny front uderza naglymi podmuchami", "piasek albo kurz tnie po twarzach", "powietrze dudni w kominach i szczelinach", "chmury rozrywane przez ostre swiatlo", "wiatr niesie odlegly zapach deszczu", "dachy i szyldy skrzypia niepokojaco", "podmuchy gasza slabe plomienie", "liscie i papier wiruja przy ziemi", "przeciag niesie echo z pustych ulic", "niebo przesuwa sie warstwami szarosci", "powietrze jest suche, ale niespokojne", "wiatr wciska kurz w kazda szczeline", "daleki pomruk burzy miesza sie z wichrem");
    }

    private List<String> windyDescriptions() {
        return List.of("wietrznie i sucho", "chmury przesuwane silniejszym wiatrem", "jasno, ale wyraznie wietrznie", "zimniejsze podmuchy miedzy krotkimi przejasnieniami", "lekki pyl unosi sie przy drogach", "wiatr porusza trawy jak fale", "niebo szybko zmienia odcienie", "chlodne powietrze splywa z wyzyn", "podmuchy niosa zapach dymu", "liscie ukladaja sie w waskie smugi", "w oddali widac poszarpane chmury", "wiatr utrudnia utrzymanie kapturow", "powietrze jest rzeske i niespokojne", "nad horyzontem zbieraja sie szare pasma", "ptaki leca nisko nad ziemia", "latarnie i szyldy kolysza sie miarowo", "zimny powiew poprzedza kazda chmure", "wiatr czysci droge z lekkiego kurzu", "przejasnienia trwaja tylko kilka minut", "podmuchy niosa wilgoc albo sol");
    }

    private List<String> clearDescriptions() {
        return List.of("bezchmurnie", "czesciowe zachmurzenie", "jasno i sucho", "cienkie chmury", "blade slonce", "suchy poranek", "cieple swiatlo po chlodnej nocy", "lagodne niebo bez zapowiedzi burzy", "wysokie chmury jak smugi kredy", "spokojne powietrze i dobra widocznosc", "slonce przebija sie przez lekka mgielke", "jasne niebo z chlodnym cieniem", "sucha droga i lekki kurz", "miekki blask przed poludniem", "powietrze czyste po nocnym wietrze", "cieply dzien bez opadow", "jasne chmury na dalekim horyzoncie", "pogodnie, ale bez upalu", "rzeski poranek z dobrym tropem", "spokojne popoludnie pod wysokim niebem");
    }

    private List<String> wetDescriptions() {
        return List.of("lekki deszcz", "ciezkie chmury", "przelotne opady", "wilgotno i pochmurno", "niska mgla po deszczu", "mzawka i bloto", "mokre kamienie i zimny zapach ziemi", "krotkie ulewy przerywane cisza", "krople spadaja z dachow dlugo po opadzie", "srebrna mgielka nad droga", "wilgoc osiada na ubraniach", "rozmokly trakt i ciche niebo", "ciemne kaluze odbijaja chmury", "deszcz przechodzi w drobna mgielke", "powietrze jest ciezkie od wilgoci", "chmury wisza nisko nad ziemia", "wiatr niesie zapach mokrego drewna", "deszcz stuka rowno o okiennice", "droga klei sie do butow", "mgla zaslania dalsze zabudowania");
    }

    private List<String> harshDescriptions() {
        return List.of("zimna mgla", "przelotny snieg", "mrozny wiatr", "niskie szare niebo", "szron i sliska droga", "mokry snieg", "zamarzajacy deszcz na kamieniach", "ostre zimno wciska sie pod ubranie", "bialy pyl sniegu niesiony przy ziemi", "lodowe grudki trzeszcza pod stopami", "ciemny poranek bez ciepla", "sople kapia mimo mrozu", "szare chmury tlumia dzwieki", "szklisty lod na koleinach", "snieg przykrywa stare slady", "powietrze szczypie w gardlo", "wiatr niesie drobny lodowy pyl", "zmarzniete bloto utrudnia marsz", "cienkie platki sniegu wiruja bez przerwy", "dzien jest jasny, ale bezlitosnie zimny");
    }

    private List<String> tropicalDescriptions() {
        return List.of("cieply deszcz", "wilgotne chmury", "nagla ulewa", "parna mgielka", "duszne powietrze przed burza", "goraca mzawka nad blotem", "ciezka wilgoc i zapach roslin", "krotki deszcz pod jasnym niebem", "para unosi sie z kamieni", "powietrze drzy przed tropikalna burza", "zielony zapach po nocnej ulewie", "wilgotny upal oblepia ubrania", "cieply wiatr niesie krople z lisci", "mgla zbiera sie pod koronami drzew", "deszcz spada grubymi, leniwymi kroplami", "slonce wraca zaraz po scianie deszczu", "oddalone grzmoty dudnia za wzgorzami", "parne powietrze utrudnia oddech", "mokre liscie tlumia kazdy krok", "burzowe chmury rosna bardzo szybko");
    }

    private List<String> aridDescriptions() {
        return List.of("bezchmurnie", "suchy upal", "pylisty wiatr", "blade niebo", "goracy wiatr i kurz", "powietrze pachnie rozgrzanym kamieniem", "horyzont drga od goraca", "cien jest krotki i twardy", "kurz osiada na jezyku", "niebo jest puste i jasne", "wiatr niesie drobny piasek", "ziemia peka pod stopami", "slonce odbija sie od jasnych skal", "sucha cisza przerywa tylko szelest piasku", "widocznosc faluje nad droga", "cieplo zostaje w murach po zmroku", "chmury sa cienkie i bezdeszczowe", "powietrze jest ostre i czyste", "pyl tworzy smugi za kazdym ruchem", "dalekie wzgorza zlewaja sie z niebem");
    }

    private List<String> coastalDescriptions() {
        return List.of("wilgotny wiatr od wody", "niskie chmury nad wybrzezem", "slona mgla", "krotkie przejasnienia i chlodny wiatr", "mewa krzyczy nad szarymi falami", "mokra bryza osiada na skorze", "dalekie fale dudnia jednostajnie", "chmury ciagna sie pasami znad morza", "powietrze pachnie sola i glonami", "mgla zakrywa latarnie na horyzoncie", "deszcz przychodzi bokiem od wody", "slonce przebija sie przez wilgotny opal", "wiatr niesie drobna sol na ubrania", "morze jest ciche, ale niepokojace", "fala chlodnego powietrza splywa na brzeg", "na kamieniach zostaje biala skorupa soli", "chmury nisko zaslaniaja klify", "piasek jest zimny i ciezki", "przejasnienia odbijaja sie w mokrych deskach", "powietrze zmienia zapach przed przyplywem");
    }

    private List<String> swampDescriptions() {
        return List.of("ciezka mgla i mokre powietrze", "lepka wilgoc", "ciepla mzawka", "nisko wiszace chmury nad mokradlami", "para stoi nad ciemna woda", "zimne krople spadaja z trzcin", "powietrze pachnie torfem", "mgla tlumi glosy juz po kilku krokach", "komary zbieraja sie w nieruchomym powietrzu", "bloto polyskuje pod cienka warstwa wody", "cieply wiatr niesie zapach gnijacych lisci", "szare niebo odbija sie w bajorach", "mokre trawy zaslaniaja stare slady", "cisza robi sie ciezka przed opadem", "krople wisza na pajeczynach", "niska mgla pelznie po ziemi", "podmuchy sa rzadkie i wilgotne", "chmury stoja nisko jak dym", "woda paruje po krotkim deszczu", "nocna wilgoc utrzymuje sie do poludnia");
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

package pl.ttrpgassistant.backend.generator;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.generator.dto.GeneratorCatalogItem;
import pl.ttrpgassistant.backend.generator.dto.GeneratorDefinitionResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorFormFieldResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorFormResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorOutputSection;
import pl.ttrpgassistant.backend.generator.dto.GeneratorParamDefinition;
import pl.ttrpgassistant.backend.generator.dto.GeneratorPoolResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRecentResultResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorResultResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorStructuredResultResponse;
import pl.ttrpgassistant.backend.generator.dto.CreateGeneratorTemplateRequest;
import pl.ttrpgassistant.backend.generator.dto.GeneratorTemplateResponse;
import pl.ttrpgassistant.backend.generator.dto.GeneratorVariantResponse;
import pl.ttrpgassistant.backend.system.SystemCodeRegistry;

import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

@Service
public class GeneratorService {

    private static final Map<Integer, int[]> DND_XP_THRESHOLDS = Map.ofEntries(
            Map.entry(1, new int[]{25, 50, 75, 100}),
            Map.entry(2, new int[]{50, 100, 150, 200}),
            Map.entry(3, new int[]{75, 150, 225, 400}),
            Map.entry(4, new int[]{125, 250, 375, 500}),
            Map.entry(5, new int[]{250, 500, 750, 1100}),
            Map.entry(6, new int[]{300, 600, 900, 1400}),
            Map.entry(7, new int[]{350, 750, 1100, 1700}),
            Map.entry(8, new int[]{450, 900, 1400, 2100}),
            Map.entry(9, new int[]{550, 1100, 1600, 2400}),
            Map.entry(10, new int[]{600, 1200, 1900, 2800}),
            Map.entry(11, new int[]{800, 1600, 2400, 3600}),
            Map.entry(12, new int[]{1000, 2000, 3000, 4500}),
            Map.entry(13, new int[]{1100, 2200, 3400, 5100}),
            Map.entry(14, new int[]{1250, 2500, 3800, 5700}),
            Map.entry(15, new int[]{1400, 2800, 4300, 6400}),
            Map.entry(16, new int[]{1600, 3200, 4800, 7200}),
            Map.entry(17, new int[]{2000, 3900, 5900, 8800}),
            Map.entry(18, new int[]{2100, 4200, 6300, 9500}),
            Map.entry(19, new int[]{2400, 4900, 7300, 10900}),
            Map.entry(20, new int[]{2800, 5700, 8500, 12700})
    );

    private static final List<EncounterCreature> DND_SRD_ENCOUNTER_POOL = List.of(
            new EncounterCreature("Goblin", 0.25, 50),
            new EncounterCreature("Kobold", 0.125, 25),
            new EncounterCreature("Bandit", 0.125, 25),
            new EncounterCreature("Cultist", 0.125, 25),
            new EncounterCreature("Skeleton", 0.25, 50),
            new EncounterCreature("Zombie", 0.25, 50),
            new EncounterCreature("Wolf", 0.25, 50),
            new EncounterCreature("Orc", 0.5, 100),
            new EncounterCreature("Hobgoblin", 0.5, 100),
            new EncounterCreature("Giant Spider", 1, 200),
            new EncounterCreature("Ghoul", 1, 200),
            new EncounterCreature("Animated Armor", 1, 200),
            new EncounterCreature("Ogre", 2, 450),
            new EncounterCreature("Gargoyle", 2, 450),
            new EncounterCreature("Minotaur", 3, 700),
            new EncounterCreature("Manticore", 3, 700),
            new EncounterCreature("Red Dragon Wyrmling", 4, 1100),
            new EncounterCreature("Troll", 5, 1800),
            new EncounterCreature("Wraith", 5, 1800),
            new EncounterCreature("Medusa", 6, 2300)
    );

    private final GeneratorPoolRepository repository;
    private final GeneratorDefinitionRepository definitionRepository;
    private final GeneratorVariantRepository variantRepository;
    private final GeneratorFieldDefinitionRepository fieldRepository;
    private final GeneratorResultRepository resultRepository;
    private final GeneratorTemplateRepository templateRepository;
    private final List<GeneratorStrategy> strategies;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public GeneratorService(
            GeneratorPoolRepository repository,
            GeneratorDefinitionRepository definitionRepository,
            GeneratorVariantRepository variantRepository,
            GeneratorFieldDefinitionRepository fieldRepository,
            GeneratorResultRepository resultRepository,
            GeneratorTemplateRepository templateRepository,
            List<GeneratorStrategy> strategies,
            ObjectMapper objectMapper
    ) {
        this.repository = repository;
        this.definitionRepository = definitionRepository;
        this.variantRepository = variantRepository;
        this.fieldRepository = fieldRepository;
        this.resultRepository = resultRepository;
        this.templateRepository = templateRepository;
        this.strategies = strategies;
        this.objectMapper = objectMapper;
    }

    public List<GeneratorCatalogItem> catalog() {
        return List.of(
                catalogItem("name", "any", "Imiona", "Imiona i nazwiska z pul seed.", List.of(
                        select("culture", "Kultura", List.of("Losowa", "Słowiańska", "Nordycka", "Arabska", "Japońska", "Elficka", "Krasnoludzka", "Orcza", "Fantastyczna"), "Losowa"),
                        select("gender", "Płeć", List.of("Losowa", "Męska", "Żeńska", "Neutralna"), "Losowa"),
                        number("count", "Liczba wyników", 1, 10, 3)
                )),
                catalogItem("npc", "dnd", "NPC D&D 5E", "Postać z wyglądem, osobowością, sekretem, motywacją i uproszczonym stat blockiem.", List.of(
                        select("race", "Rasa", List.of("Losowa", "Człowiek", "Elf", "Krasnolud", "Niziołek", "Gnom", "Półelf", "Półork", "Tiefling", "Dragonborn"), "Losowa"),
                        select("profession", "Profesja/Klasa", List.of("Losowa", "Strażnik", "Kupiec", "Wiedźma", "Złodziej", "Kapłan", "Szlachcic", "Chłop", "Żołnierz", "Magik", "Łowca nagród", "Skryba", "Alchemik"), "Losowa"),
                        select("role", "Rola fabularna", List.of("Losowa", "Villain", "Quest Giver", "Ally", "Contact", "Neutral", "Rival", "Informant"), "Losowa"),
                        select("alignment", "Charakter", List.of("Losowy", "Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil"), "Losowy"),
                        number("level", "Poziom", 1, 20, 5)
                )),
                catalogItem("encounter", "dnd", "Encounter D&D 5E", "Budżet XP i propozycja potworów z puli SRD.", List.of(
                        number("partyLevel", "Poziom drużyny", 1, 20, 5),
                        number("partySize", "Liczba graczy", 2, 8, 4),
                        select("difficulty", "Trudność", List.of("Easy", "Medium", "Hard", "Deadly"), "Medium")
                )),
                catalogItem("loot", "dnd", "Skarb D&D 5E", "Skarb w stylu Donjon/Kassoon: monety, kosztowności, przedmioty, magia i miejsce ukrycia.", List.of(
                        select("treasureType", "Typ skarbu", List.of("Individual Loot", "Treasure Hoard"), "Treasure Hoard"),
                        select("crBand", "CR / poziom skarbca", List.of("0-4", "5-10", "11-16", "17+"), "0-4"),
                        select("contents", "Zawartość", List.of("Wszystko", "Monety", "Kosztowności", "Magiczne"), "Wszystko"),
                        select("theme", "Motyw", List.of("Podziemie", "Szlachta", "Religijny", "Dzicz", "Arkana"), "Podziemie")
                )),
                catalogItem("twist", "any", "Twist", "Szybki zwrot do sceny.", List.of(
                        select("scene", "Scena", List.of("Losowa", "Walka", "Negocjacje", "Śledztwo", "Podróż"), "Losowa")
                )),
                catalogItem("hook", "any", "Haczyk sesji", "Start sceny lub sesji.", List.of(
                        select("mood", "Klimat", List.of("Losowy", "Tajemnica", "Przygodowy", "Horror"), "Losowy")
                )),
                catalogItem("weather", "any", "Pogoda", "Opis pogody z drobnym efektem.", List.of(
                        select("climate", "Klimat", List.of("Losowy", "Umiarkowany", "Górski", "Tropikalny"), "Losowy")
                )),
                catalogItem("complication", "any", "Komplikacja", "Jedno kliknięcie, jeden problem.", List.of()),
                catalogItem("encounter", "pf2e", "Encounter PF2E", "Budżet XP PF2E na start.", List.of(
                        number("partyLevel", "Poziom drużyny", 1, 20, 3),
                        number("partySize", "Liczba graczy", 2, 6, 4),
                        select("difficulty", "Trudność", List.of("Trivial", "Low", "Moderate", "Severe", "Extreme"), "Moderate")
                )),
                catalogItem("scvm", "morkborg", "Scvm Mork Borg", "Brudna, szybka postać startowa.", List.of(
                        select("className", "Klasa", List.of("Losowa", "Classless", "Gutterborn Scum", "Fanged Deserter", "Heretical Priest"), "Losowa")
                ))
        );
    }

    public List<GeneratorDefinitionResponse> definitions() {
        return definitionRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(definition -> new GeneratorDefinitionResponse(
                        definition.getCode(),
                        definition.getName(),
                        definition.getDescription(),
                        definition.getCategory(),
                        definition.getIcon(),
                        variants(definition.getCode())
                ))
                .toList();
    }

    public List<GeneratorVariantResponse> variants(String generatorCode) {
        return variantRepository.findByGeneratorDefinition_CodeAndActiveTrueOrderByNameAsc(normalize(generatorCode)).stream()
                .map(this::variantResponse)
                .toList();
    }

    public GeneratorFormResponse form(String generatorCode, String variantCode) {
        GeneratorVariantEntity variant = findVariant(generatorCode, variantCode);
        List<GeneratorFormFieldResponse> fields = fieldRepository.findByVariant_IdOrderByOrderIndexAsc(variant.getId()).stream()
                .map(field -> new GeneratorFormFieldResponse(
                        field.getFieldKey(),
                        field.getLabel(),
                        field.getType(),
                        parseOptions(field.getOptionsJson()),
                        parseDefaultValue(field),
                        field.isRequired(),
                        field.getOrderIndex()
                ))
                .toList();

        return new GeneratorFormResponse(
                variant.getGeneratorDefinition().getCode(),
                variant.getVariantCode(),
                variant.getName(),
                variant.getDescription(),
                fields
        );
    }

    public boolean hasVariant(String generatorCode, String variantCode) {
        return variantRepository.existsByGeneratorDefinition_CodeAndVariantCodeAndActiveTrue(normalize(generatorCode), normalizeVariant(variantCode));
    }

    public GeneratorStructuredResultResponse generateVariant(String generatorCode, String variantCode, GeneratorRequest request) {
        String normalizedGenerator = normalize(generatorCode);
        String normalizedVariant = normalizeVariant(variantCode);
        findVariant(normalizedGenerator, normalizedVariant);

        GeneratorStrategy strategy = strategies.stream()
                .filter(candidate -> candidate.supports(normalizedGenerator, normalizedVariant))
                .findFirst()
                .orElse(null);

        GeneratorStructuredResultResponse generated = strategy == null
                ? legacyVariant(normalizedGenerator, normalizedVariant, request)
                : strategy.generate(request);
        GeneratorResultEntity saved = new GeneratorResultEntity();
        saved.setCampaignId(request == null ? null : request.campaignId());
        saved.setGeneratorCode(normalizedGenerator);
        saved.setVariantCode(normalizedVariant);
        saved.setInputJson(writeJson(request == null || request.params() == null ? Map.of() : request.params()));
        saved.setOutputJson(writeJson(generated));
        saved.setTitle(generated.title());
        saved.setSummary(generated.subtitle());
        saved.setCreatedAt(generated.generatedAt());
        saved = resultRepository.save(saved);

        return new GeneratorStructuredResultResponse(
                saved.getId(),
                generated.generatorCode(),
                generated.variantCode(),
                generated.title(),
                generated.subtitle(),
                generated.sections(),
                generated.source(),
                generated.generatedAt()
        );
    }

    public List<GeneratorRecentResultResponse> recentResults() {
        return resultRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(result -> new GeneratorRecentResultResponse(
                        result.getId(),
                        result.getGeneratorCode(),
                        result.getVariantCode(),
                        result.getTitle(),
                        result.getSummary(),
                        result.getCreatedAt()
                ))
                .toList();
    }

    public List<GeneratorTemplateResponse> templates(Long userId) {
        return templateRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::templateResponse)
                .toList();
    }

    public GeneratorTemplateResponse createTemplate(Long userId, CreateGeneratorTemplateRequest request) {
        if (request == null || request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Template name is required");
        }
        String generatorCode = normalize(request.generatorCode());
        String variantCode = normalizeVariant(request.variantCode());
        findVariant(generatorCode, variantCode);

        GeneratorTemplateEntity entity = new GeneratorTemplateEntity();
        entity.setUserId(userId);
        entity.setName(request.name().trim());
        entity.setGeneratorCode(generatorCode);
        entity.setVariantCode(variantCode);
        entity.setConfigJson(writeJson(request.config() == null ? Map.of() : request.config()));
        entity.setCreatedAt(OffsetDateTime.now());
        return templateResponse(templateRepository.save(entity));
    }

    private GeneratorTemplateResponse templateResponse(GeneratorTemplateEntity entity) {
        return new GeneratorTemplateResponse(
                entity.getId(),
                entity.getName(),
                entity.getGeneratorCode(),
                entity.getVariantCode(),
                readJsonMap(entity.getConfigJson()),
                entity.getCreatedAt()
        );
    }

    private GeneratorStructuredResultResponse legacyVariant(String generatorCode, String variantCode, GeneratorRequest request) {
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();
        GeneratorResultResponse legacy = switch (generatorCode + ":" + variantCode) {
            case "name:general.quick" -> generate("any", "name", request);
            case "npc:dnd.quick" -> generate("dnd", "npc", request);
            case "loot:dnd.quick" -> generate("dnd", "loot", request);
            case "weather:general.quick" -> generate("any", "weather", request);
            case "hook:general.quick" -> generate("any", "hook", request);
            case "twist:general.quick" -> generate("any", "twist", request);
            default -> throw new ResourceNotFoundException("Generator strategy not found");
        };

        List<GeneratorOutputSection> sections = legacy.payload().entrySet().stream()
                .map(entry -> new GeneratorOutputSection(
                        "text",
                        entry.getKey(),
                        renderLegacyValue(entry.getValue()),
                        List.of()
                ))
                .toList();

        return new GeneratorStructuredResultResponse(
                null,
                generatorCode,
                variantCode,
                legacy.title(),
                legacySubtitle(generatorCode, variantCode, params),
                sections,
                legacy.source(),
                legacy.generatedAt()
        );
    }

    private String renderLegacyValue(Object value) {
        if (value == null) return "";
        if (value instanceof List<?> list) {
            return list.stream().map(String::valueOf).reduce((a, b) -> a + ", " + b).orElse("");
        }
        if (value instanceof Map<?, ?>) {
            return writeJson(value);
        }
        return String.valueOf(value);
    }

    private String legacySubtitle(String generatorCode, String variantCode, Map<String, Object> params) {
        return switch (generatorCode + ":" + variantCode) {
            case "name:general.quick" -> "Imiona ogólne";
            case "npc:dnd.quick" -> "D&D 5E | poziom " + stringParam(params, "level", "5");
            case "loot:dnd.quick" -> "D&D 5E | " + stringParam(params, "crBand", "0-4");
            case "weather:general.quick" -> "Pogoda | " + stringParam(params, "climate", "Losowy");
            case "hook:general.quick" -> "Haczyk | " + stringParam(params, "mood", "Losowy");
            case "twist:general.quick" -> "Twist | " + stringParam(params, "scene", "Losowa");
            default -> variantCode;
        };
    }

    public GeneratorPoolResponse getPool(String type, String system) {
        String normalizedType = normalize(type);
        String normalizedSystem = SystemCodeRegistry.normalize(system);
        GeneratorPoolEntity entity = findPool(normalizedType, normalizedSystem, "default");

        return new GeneratorPoolResponse(
                normalizedType,
                normalizedSystem,
                readPayload(entity)
        );
    }

    public GeneratorResultResponse generate(String system, String type, GeneratorRequest request) {
        String normalizedSystem = SystemCodeRegistry.normalize(system);
        String normalizedType = normalize(type);
        Map<String, Object> params = request == null || request.params() == null ? Map.of() : request.params();

        return switch (normalizedType) {
            case "name" -> names(params);
            case "npc" -> npc(normalizedSystem, params);
            case "loot", "item" -> loot(normalizedSystem, params);
            case "twist" -> fromEntries("twist", "any", "Twist fabularny", params);
            case "hook" -> hook(params);
            case "complication" -> complication();
            case "weather" -> weather(params);
            case "encounter" -> "pf2e".equals(normalizedSystem) ? pf2eEncounter(params) : dndEncounter(params);
            case "scvm" -> scvm(params);
            default -> generic(normalizedSystem, normalizedType, params);
        };
    }

    private GeneratorResultResponse names(Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("name", "any", "default"));
        Map<String, Object> cultures = asMap(pool.get("cultures"));
        String requestedCulture = stringParam(params, "culture", "Losowa");
        String culture = isRandomChoice(requestedCulture) ? pick(new ArrayList<>(cultures.keySet())) : matchingKey(cultures, requestedCulture);
        Map<String, Object> selected = asMap(cultures.getOrDefault(culture, cultures.values().stream().findFirst().orElse(Map.of())));
        String requestedGender = stringParam(params, "gender", "Losowa");
        String genderKey = genderKey(requestedGender);
        int count = intParam(params, "count", 3, 1, 10);

        List<String> results = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String currentGenderKey = "random".equals(genderKey)
                    ? pick(List.of("male", "female", "neutral"))
                    : genderKey;
            List<Object> given = asList(selected.get(currentGenderKey));
            if (given.isEmpty()) {
                given = asList(selected.get("neutral"));
            }
            results.add(pick(given) + " " + pick(asList(selected.get("family"))));
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Kultura", culture);
        payload.put("Płeć", requestedGender);
        payload.put("Imiona", String.join(", ", results));
        return result("name", "any", "Generator imion", payload, "seed");
    }

    private GeneratorResultResponse npc(String system, Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("npc", system, "default"));
        int level = intParam(params, "level", 5, 1, 20);
        String race = choiceParam(params, "race", asList(pool.get("races")), system.equals("dnd") ? "Człowiek" : "Lokalna");
        String profession = choiceParam(params, "profession", asList(pool.get("professions")), pick(asList(pool.get("archetypes"))));
        String role = choiceParam(params, "role", asList(pool.get("roles")), "Contact");
        String alignment = choiceParam(params, "alignment", asList(pool.get("alignments")), "True Neutral");
        String fullName = pick(asList(pool.get("names"))) + " " + pick(asList(pool.get("family")));
        Map<String, Object> appearance = asMap(pool.get("appearance"));
        String look = String.join(", ",
                pick(asList(appearance.get("build"))),
                pick(asList(appearance.get("face"))),
                pick(asList(appearance.get("clothes")))
        );
        int proficiency = Math.max(2, 2 + ((level - 1) / 4));
        int dex = 10 + random.nextInt(8);
        int con = 10 + random.nextInt(8);
        int mainStat = 12 + Math.min(6, proficiency + random.nextInt(3));
        int hp = Math.max(4, level * (5 + ((con - 10) / 2)) + 6);
        int ac = 11 + Math.min(6, (dex - 10) / 2 + proficiency / 2);
        String attack = pick(asList(pool.get("attacks")));
        String hook = pick(asList(pool.get("hooks")));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Imię", fullName);
        payload.put("System", systemLabel(system));
        payload.put("Tożsamość", race + " | " + profession + " " + level + " | " + alignment);
        payload.put("Rola fabularna", role);
        payload.put("Wygląd", look);
        payload.put("Osobowość", pick(asList(pool.get("personalities"))));
        payload.put("Ideał", pick(asList(pool.get("ideals"))));
        payload.put("Sekret", pick(asList(pool.get("secrets"))));
        payload.put("Motywacja", pick(asList(pool.get("motivations"))));
        payload.put("Haczyk dla drużyny", hook);
        if ("dnd".equals(system)) {
            payload.put("Stat block", "HP %d, AC %d, Init +%d, Speed 30ft, Prof +%d".formatted(hp, ac, Math.max(0, (dex - 10) / 2), proficiency));
            payload.put("Atrybuty", "STR %d, DEX %d, CON %d, INT %d, WIS %d, CHA %d".formatted(mainStat, dex, con, 8 + random.nextInt(8), 8 + random.nextInt(8), 8 + random.nextInt(8)));
            payload.put("Atak", "%s +%d do trafienia, 1d6+%d obrażeń".formatted(attack, proficiency + 2, Math.max(1, proficiency)));
        }
        return result("npc", system, "Wygenerowany NPC", payload, "seed");
    }

    private GeneratorResultResponse loot(String system, Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("loot", system, "default"));
        String type = stringParam(params, "treasureType", "Treasure Hoard");
        String crBand = stringParam(params, "crBand", "0-4");
        String contents = stringParam(params, "contents", "Wszystko");
        String theme = stringParam(params, "theme", "Podziemie");
        int tier = crTier(crBand);
        boolean hoard = type.toLowerCase(Locale.ROOT).contains("hoard") || type.toLowerCase(Locale.ROOT).contains("skarbiec");
        boolean includeCoins = includes(contents, "Monety") || includes(contents, "Wszystko");
        boolean includeValuables = includes(contents, "Kosztowności") || includes(contents, "Wszystko");
        boolean includeMagic = includes(contents, "Magiczne") || includes(contents, "Wszystko");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Typ", hoard ? "Treasure Hoard" : "Individual Loot");
        payload.put("CR / poziom", crBand);
        payload.put("Motyw", theme);
        if (includeCoins) {
            payload.put("Monety", coinsForTier(tier, hoard));
        }
        if (includeValuables) {
            payload.put("Klejnoty i kosztowności", valuablesForTier(pool, tier, hoard));
        }
        if (includeMagic) {
            payload.put("Magiczne przedmioty", magicItemsForTier(pool, tier, hoard));
        }
        if (!includeCoins && !includeValuables && !includeMagic) {
            payload.put("Znalezisko", pick(asList(pool.get("mundaneItems"))));
        } else {
            payload.put("Drobiazgi", mundaneItems(pool, hoard ? 3 : 1));
        }
        payload.put("Gdzie leży", pick(asList(pool.get("containers"))) + ", " + pick(asList(pool.get("hidingPlaces"))));
        payload.put("Szczegół MG", pick(asList(pool.get("quirks"))));
        return result("loot", system, hoard ? "Skarbiec D&D 5E" : "Łup indywidualny D&D 5E", payload, "algorithm");
    }

    private GeneratorResultResponse dndEncounter(Map<String, Object> params) {
        int partyLevel = intParam(params, "partyLevel", 5, 1, 20);
        int partySize = intParam(params, "partySize", 4, 2, 8);
        String difficulty = stringParam(params, "difficulty", "Medium");
        int difficultyIndex = switch (difficulty.toLowerCase(Locale.ROOT)) {
            case "easy", "łatwa" -> 0;
            case "hard", "trudna" -> 2;
            case "deadly", "zabójcza" -> 3;
            default -> 1;
        };
        int budget = DND_XP_THRESHOLDS.getOrDefault(partyLevel, DND_XP_THRESHOLDS.get(5))[difficultyIndex] * partySize;
        double maxCr = Math.max(0.25, Math.min(partyLevel + 2, 10));
        List<EncounterCreature> candidates = DND_SRD_ENCOUNTER_POOL.stream()
                .filter(creature -> creature.challengeRating() <= maxCr)
                .sorted((left, right) -> Integer.compare(right.xp(), left.xp()))
                .toList();

        List<String> monsters = new ArrayList<>();
        int xp = 0;
        for (EncounterCreature monster : candidates) {
            if (monsters.size() >= 6 || monster.xp() > budget) continue;
            if (xp + monster.xp() <= budget * 1.15) {
                monsters.add(monster.name() + " (CR " + formatCr(monster.challengeRating()) + ", " + monster.xp() + " XP)");
                xp += monster.xp();
            }
            if (xp >= budget * 0.75) break;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("System", "D&D 5E");
        payload.put("Poziom drużyny", partyLevel);
        payload.put("Liczba graczy", partySize);
        payload.put("Trudność", difficulty);
        payload.put("Budżet XP", budget);
        payload.put("Propozycja", monsters.isEmpty() ? "Brak pasujących potworów w puli SRD" : String.join("; ", monsters));
        payload.put("XP bazowe", xp);
        payload.put("Notatka MG", "Sprawdź ekonomię akcji i teren, bo sam budżet XP nie mówi wszystkiego.");
        return result("encounter", "dnd", "Encounter D&D 5E", payload, "algorithm");
    }

    private GeneratorResultResponse pf2eEncounter(Map<String, Object> params) {
        int partyLevel = intParam(params, "partyLevel", 3, 1, 20);
        int partySize = intParam(params, "partySize", 4, 2, 6);
        String difficulty = stringParam(params, "difficulty", "Moderate");
        int budget = switch (difficulty.toLowerCase(Locale.ROOT)) {
            case "trivial" -> 40;
            case "low" -> 60;
            case "severe" -> 120;
            case "extreme" -> 160;
            default -> 80;
        };
        budget = Math.round(budget * (partySize / 4.0f));
        Map<String, Object> pool = readPayload(findPool("encounter", "pf2e", "default"));
        List<Object> creatures = asList(pool.get("creatures"));
        Map<String, Object> creature = asMap(pickObject(creatures));

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("System", "Pathfinder 2E");
        payload.put("Poziom drużyny", partyLevel);
        payload.put("Liczba graczy", partySize);
        payload.put("Trudność", difficulty);
        payload.put("Budżet XP", budget);
        payload.put("Propozycja", creature.get("name") + " x2 albo jeden mocniejszy przeciwnik z poziomu " + partyLevel);
        payload.put("Środowisko", creature.get("environment"));
        return result("encounter", "pf2e", "Encounter PF2E", payload, "algorithm");
    }

    private GeneratorResultResponse hook(Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("hook", "any", "default"));
        List<Object> entries = asList(pool.get("entries"));
        String mood = stringParam(params, "mood", "Losowy");
        Map<String, Object> entry = entries.stream()
                .map(this::asMap)
                .filter(e -> "Losowy".equalsIgnoreCase(mood) || mood.equalsIgnoreCase(String.valueOf(e.get("mood"))))
                .findAny()
                .orElseGet(() -> asMap(pickObject(entries)));
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Klimat", entry.get("mood"));
        payload.put("Skala", entry.get("scale"));
        payload.put("Sytuacja", entry.get("situation"));
        payload.put("Dziwny szczegół", entry.get("detail"));
        payload.put("Tropy", entry.get("lead"));
        return result("hook", "any", "Haczyk sesji", payload, "seed");
    }

    private GeneratorResultResponse complication() {
        Map<String, Object> pool = readPayload(findPool("complication", "any", "default"));
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Komplikacja", pick(asList(pool.get("entries"))));
        return result("complication", "any", "Komplikacja sceny", payload, "seed");
    }

    private GeneratorResultResponse weather(Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("weather", "any", "default"));
        List<Object> entries = asList(pool.get("entries"));
        String climate = stringParam(params, "climate", "Losowy");
        Map<String, Object> entry = entries.stream()
                .map(this::asMap)
                .filter(e -> "Losowy".equalsIgnoreCase(climate) || climate.equalsIgnoreCase(String.valueOf(e.get("climate"))))
                .findAny()
                .orElseGet(() -> asMap(pickObject(entries)));
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Klimat", entry.get("climate"));
        payload.put("Pora", entry.get("season"));
        payload.put("Nastrój", entry.get("mood"));
        payload.put("Opis", entry.get("description"));
        payload.put("Efekt", entry.get("effect"));
        return result("weather", "any", "Pogoda", payload, "seed");
    }

    private GeneratorResultResponse scvm(Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool("scvm", "morkborg", "default"));
        String requestedClass = stringParam(params, "className", "Losowa");
        String className = "Losowa".equalsIgnoreCase(requestedClass) ? pick(asList(pool.get("classes"))) : requestedClass;
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("Imię", pick(asList(pool.get("names"))));
        payload.put("Klasa", className);
        payload.put("Agility", random.nextInt(5) - 2);
        payload.put("Presence", random.nextInt(5) - 2);
        payload.put("Strength", random.nextInt(5) - 2);
        payload.put("Toughness", random.nextInt(5) - 2);
        payload.put("HP", 1 + random.nextInt(8));
        payload.put("Omens", 1 + random.nextInt(4));
        payload.put("Silver", 2 + random.nextInt(20));
        payload.put("Ekwipunek", pick(asList(pool.get("gear"))) + ", " + pick(asList(pool.get("gear"))));
        payload.put("Przeklęty szczegół", pick(asList(pool.get("curses"))));
        return result("scvm", "morkborg", "Scvm Mork Borg", payload, "seed");
    }

    private GeneratorResultResponse fromEntries(String type, String system, String title, Map<String, Object> params) {
        Map<String, Object> pool = readPayload(findPool(type, system, "default"));
        List<Object> entries = asList(pool.get("entries"));
        Object selected = pickObject(entries);
        Map<String, Object> payload = new LinkedHashMap<>();
        if (selected instanceof Map<?, ?>) {
            asMap(selected).forEach((k, v) -> payload.put(String.valueOf(k), v));
        } else {
            payload.put("Wynik", selected);
        }
        return result(type, system, title, payload, "seed");
    }

    private GeneratorResultResponse generic(String system, String type, Map<String, Object> params) {
        GeneratorPoolEntity pool = findPool(type, system, "default");
        Map<String, Object> data = readPayload(pool);
        Map<String, Object> payload = new LinkedHashMap<>();
        data.forEach((key, value) -> {
            if (value instanceof List<?> list) {
                payload.put(pretty(key), pickObject(new ArrayList<>(list)));
            }
        });
        if (payload.isEmpty()) {
            payload.put("Parametry", params);
        }
        return result(type, system, "Wygenerowany wynik", payload, "seed");
    }

    private GeneratorVariantResponse variantResponse(GeneratorVariantEntity variant) {
        return new GeneratorVariantResponse(
                variant.getGeneratorDefinition().getCode(),
                variant.getVariantCode(),
                variant.getSystemCode(),
                variant.getSettingCode(),
                variant.getMode(),
                variant.getName(),
                variant.getDescription()
        );
    }

    private GeneratorVariantEntity findVariant(String generatorCode, String variantCode) {
        return variantRepository.findByGeneratorDefinition_CodeAndVariantCodeAndActiveTrue(normalize(generatorCode), normalizeVariant(variantCode))
                .orElseThrow(() -> new ResourceNotFoundException("Generator variant not found"));
    }

    private List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Object parseDefaultValue(GeneratorFieldDefinitionEntity field) {
        String value = field.getDefaultValue();
        if (value == null) {
            return null;
        }
        if ("CHECKBOX".equalsIgnoreCase(field.getType()) || "TOGGLE".equalsIgnoreCase(field.getType())) {
            return Boolean.parseBoolean(value);
        }
        if ("NUMBER".equalsIgnoreCase(field.getType()) || "RANGE".equalsIgnoreCase(field.getType())) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException ignored) {
                return value;
            }
        }
        return value;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator JSON payload");
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ex) {
            return Map.of();
        }
    }

    private GeneratorPoolEntity findPool(String type, String system, String subtype) {
        return repository.findByGeneratorTypeAndSystemCodeAndSubtype(type, system, subtype)
                .or(() -> repository.findByGeneratorTypeAndSystemCodeAndSubtype(type, "any", subtype))
                .or(() -> repository.findByGeneratorTypeAndSystemCode(type, system))
                .or(() -> repository.findByGeneratorTypeAndSystemCode(type, "any"))
                .orElseThrow(() -> new ResourceNotFoundException("Generator pool not found"));
    }

    private Map<String, Object> readPayload(GeneratorPoolEntity entity) {
        try {
            return objectMapper.readValue(entity.getPayloadJson(), new TypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid generator pool payload");
        }
    }

    private GeneratorResultResponse result(String type, String system, String title, Map<String, Object> payload, String source) {
        return new GeneratorResultResponse(type, system, title, payload, source, OffsetDateTime.now());
    }

    private GeneratorCatalogItem catalogItem(String type, String system, String label, String description, List<GeneratorParamDefinition> params) {
        return new GeneratorCatalogItem(type, system, label, description, params, "seed/algorithm");
    }

    private GeneratorParamDefinition select(String key, String label, List<String> options, Object defaultValue) {
        return new GeneratorParamDefinition(key, label, "select", options, null, null, defaultValue);
    }

    private GeneratorParamDefinition number(String key, String label, int min, int max, Object defaultValue) {
        return new GeneratorParamDefinition(key, label, "number", List.of(), min, max, defaultValue);
    }

    private GeneratorParamDefinition text(String key, String label, Object defaultValue) {
        return new GeneratorParamDefinition(key, label, "text", List.of(), null, null, defaultValue);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeVariant(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private int intParam(Map<String, Object> params, String key, int fallback, int min, int max) {
        Object value = params.get(key);
        int parsed = fallback;
        if (value instanceof Number number) {
            parsed = number.intValue();
        } else if (value != null && !String.valueOf(value).isBlank()) {
            try {
                parsed = Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                parsed = fallback;
            }
        }
        return Math.max(min, Math.min(max, parsed));
    }

    private String stringParam(Map<String, Object> params, String key, String fallback) {
        Object value = params.get(key);
        return value == null || String.valueOf(value).isBlank() ? fallback : String.valueOf(value);
    }

    private String choiceParam(Map<String, Object> params, String key, List<Object> options, String fallback) {
        String value = stringParam(params, key, "Losowa");
        if ("Losowa".equalsIgnoreCase(value) || "Losowy".equalsIgnoreCase(value)) {
            return pick(options);
        }
        return value;
    }

    private String genderKey(String value) {
        return switch (looseKey(value)) {
            case "męska", "meska", "male" -> "male";
            case "żeńska", "zenska", "female" -> "female";
            case "neutralna", "neutral" -> "neutral";
            default -> "random";
        };
    }

    private boolean includes(String value, String option) {
        return value != null && looseKey(value).contains(looseKey(option));
    }

    private int crTier(String crBand) {
        if (crBand == null) return 0;
        if (crBand.contains("17")) return 3;
        if (crBand.contains("11")) return 2;
        if (crBand.contains("5")) return 1;
        return 0;
    }

    private String coinsForTier(int tier, boolean hoard) {
        int scale = hoard ? 8 : 1;
        int cp = tier <= 1 ? roll(4, 6) * 10 * scale : 0;
        int sp = roll(3 + tier, 6) * 10 * scale;
        int gp = roll(2 + tier, 6) * (tier == 0 ? 5 : 25) * scale;
        int pp = tier >= 2 ? roll(1 + tier, 6) * 5 * scale : 0;
        List<String> coins = new ArrayList<>();
        if (cp > 0) coins.add(cp + " cp");
        if (sp > 0) coins.add(sp + " sp");
        if (gp > 0) coins.add(gp + " gp");
        if (pp > 0) coins.add(pp + " pp");
        return String.join(", ", coins);
    }

    private String valuablesForTier(Map<String, Object> pool, int tier, boolean hoard) {
        List<Object> gems = asList(pool.get("gems"));
        List<Object> artObjects = asList(pool.get("artObjects"));
        int count = hoard ? 2 + tier + random.nextInt(3) : 1 + random.nextInt(2);
        List<String> valuables = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> item = asMap(random.nextBoolean() ? pickObject(gems) : pickObject(artObjects));
            if (item.isEmpty() || item.get("name") == null) {
                continue;
            }
            int value = numeric(item.get("value"), 25);
            if (value <= Math.max(25, 50 * (tier + 1) * (hoard ? 4 : 1))) {
                valuables.add(item.get("name") + " (" + value + " gp)");
            }
        }
        if (valuables.isEmpty()) {
            Map<String, Object> fallback = asMap(pickObject(gems));
            if (!fallback.isEmpty() && fallback.get("name") != null) {
                valuables.add(fallback.get("name") + " (" + numeric(fallback.get("value"), 25) + " gp)");
            } else {
                valuables.add("drobne kosztownosci (" + (25 * (tier + 1)) + " gp)");
            }
        }
        return String.join("; ", valuables);
    }

    private String magicItemsForTier(Map<String, Object> pool, int tier, boolean hoard) {
        Map<String, Object> magicItems = asMap(pool.get("magicItems"));
        List<String> rarities = switch (tier) {
            case 0 -> List.of("common", "uncommon");
            case 1 -> List.of("common", "uncommon", "rare");
            case 2 -> List.of("uncommon", "rare", "veryRare");
            default -> List.of("rare", "veryRare", "legendary");
        };
        int count = hoard ? 1 + random.nextInt(Math.max(2, tier + 2)) : random.nextInt(100) < 35 + tier * 15 ? 1 : 0;
        if (count <= 0) {
            return "Brak stałego magicznego przedmiotu; rozważ consumable albo wskazówkę fabularną.";
        }
        List<String> results = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String rarity = pick(rarities);
            String item = pick(asList(magicItems.get(rarity)));
            if (item.isBlank()) {
                item = "jednorazowy przedmiot magiczny";
            }
            results.add(item + " (" + rarityLabel(rarity) + ")");
        }
        return String.join("; ", results);
    }

    private String mundaneItems(Map<String, Object> pool, int count) {
        List<String> results = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String item = pick(asList(pool.get("mundaneItems")));
            if (!item.isBlank()) {
                results.add(item);
            }
        }
        return results.isEmpty() ? "slad po poprzednim wlascicielu" : String.join("; ", results);
    }

    private boolean isRandomChoice(String value) {
        String normalized = looseKey(value);
        return normalized.equals("losowa") || normalized.equals("losowy") || normalized.equals("random");
    }

    private String matchingKey(Map<String, Object> values, String requested) {
        String requestedKey = looseKey(requested);
        return values.keySet().stream()
                .filter(key -> looseKey(key).equals(requestedKey))
                .findFirst()
                .orElseGet(() -> values.keySet().stream().findFirst().orElse(requested));
    }

    private String looseKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replace("ł", "l")
                .replace("Ł", "L")
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private int roll(int dice, int sides) {
        int total = 0;
        for (int i = 0; i < dice; i++) {
            total += 1 + random.nextInt(sides);
        }
        return total;
    }

    private int numeric(Object value, int fallback) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private String rarityLabel(String rarity) {
        return switch (rarity) {
            case "common" -> "common";
            case "uncommon" -> "uncommon";
            case "rare" -> "rare";
            case "veryRare" -> "very rare";
            case "legendary" -> "legendary";
            default -> rarity;
        };
    }

    private String formatCr(double challengeRating) {
        if (challengeRating == 0.125) return "1/8";
        if (challengeRating == 0.25) return "1/4";
        if (challengeRating == 0.5) return "1/2";
        if (challengeRating == Math.rint(challengeRating)) {
            return String.valueOf((int) challengeRating);
        }
        return String.valueOf(challengeRating);
    }

    private String pick(List<?> list) {
        Object picked = pickObject(list);
        return picked == null ? "" : String.valueOf(picked);
    }

    private Object pickObject(List<?> list) {
        if (list == null || list.isEmpty()) return "";
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

    private String pretty(String key) {
        if (key == null || key.isBlank()) return "Wynik";
        return key.substring(0, 1).toUpperCase(Locale.ROOT) + key.substring(1).replace("_", " ");
    }

    private String systemLabel(String system) {
        return switch (system) {
            case "cthulhu" -> "Call of Cthulhu 7E";
            case "wh4e" -> "Warhammer Fantasy 4E";
            case "pf2e" -> "Pathfinder 2E";
            case "morkborg" -> "Mork Borg";
            case "dnd" -> "D&D 5E";
            default -> system;
        };
    }

    private record EncounterCreature(String name, double challengeRating, int xp) {}
}

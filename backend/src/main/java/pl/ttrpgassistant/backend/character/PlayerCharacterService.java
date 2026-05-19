package pl.ttrpgassistant.backend.character;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterDetailsResponse;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterSummaryResponse;
import pl.ttrpgassistant.backend.character.dto.QuickCreateDndCharacterRequest;
import pl.ttrpgassistant.backend.character.dto.UpdateCharacterSheetRequest;
import pl.ttrpgassistant.backend.character.dto.CreateCocQuickCharacterRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlayerCharacterService {

    private final PlayerCharacterRepository playerCharacterRepository;
    private final DndCharacterSheetService dndSheetService;
    private final CocCharacterSheetService cocSheetService;
    private final DndCompendiumService compendiumService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<PlayerCharacterSummaryResponse> listForUser(Long userId) {
        return playerCharacterRepository.findByOwnerUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlayerCharacterDetailsResponse getForUser(Long userId, Long characterId) {
        return toDetails(requireOwnedCharacter(userId, characterId));
    }

    @Transactional
    public PlayerCharacterDetailsResponse quickCreate(Long userId, QuickCreateDndCharacterRequest request) {
        Map<String, Object> sheet = dndSheetService.generate(
                request.name().trim(),
                request.raceIndex().trim(),
                request.classIndex().trim(),
                request.backgroundIndex().trim(),
                normalizeNullable(request.portraitUrl())
        );

        PlayerCharacterEntity entity = PlayerCharacterEntity.builder()
                .ownerUserId(userId)
                .systemCode("dnd5e")
                .status("ACTIVE")
                .name(request.name().trim())
                .portraitUrl(normalizeNullable(request.portraitUrl()))
                .raceName(labelFromSnapshot(sheet, "race"))
                .className(labelFromSnapshot(sheet, "class"))
                .backgroundName(labelFromSnapshot(sheet, "background"))
                .level(1)
                .maxHp(intFromCombat(sheet, "maxHp", 1))
                .currentHp(intFromCombat(sheet, "currentHp", 1))
                .tempHp(intFromCombat(sheet, "tempHp", 0))
                .privateNotes("")
                .sheetJson(writeSheet(sheet))
                .build();

        return toDetails(playerCharacterRepository.save(entity));
    }

    @Transactional
    public PlayerCharacterDetailsResponse quickCreateCoc(Long userId, CreateCocQuickCharacterRequest request) {
        Map<String, Object> sheet = cocSheetService.generate(request);
        Map<String, Object> identity = map(sheet, "identity");
        Map<String, Object> derived = map(sheet, "derived");
        String fullName = String.valueOf(identity.getOrDefault("name", "Investigator"));
        String occupation = String.valueOf(identity.getOrDefault("occupation", "Investigator"));
        int hp = intValue(derived.get("hp"), 10);

        PlayerCharacterEntity entity = PlayerCharacterEntity.builder()
                .ownerUserId(userId)
                .systemCode("coc7e")
                .status("ACTIVE")
                .name(fullName)
                .portraitUrl(normalizeNullable((String) identity.get("portraitUrl")))
                .raceName("Human")
                .className(occupation)
                .backgroundName("")
                .level(0)
                .maxHp(hp)
                .currentHp(hp)
                .tempHp(0)
                .privateNotes("")
                .sheetJson(writeSheet(sheet))
                .build();

        return toDetails(playerCharacterRepository.save(entity));
    }

    @Transactional
    public PlayerCharacterDetailsResponse updateSheet(Long userId, Long characterId, UpdateCharacterSheetRequest request) {
        PlayerCharacterEntity entity = requireOwnedCharacter(userId, characterId);
        Map<String, Object> sheet = readSheet(entity.getSheetJson());

        if (request.name() != null && !request.name().isBlank()) {
            String name = request.name().trim();
            entity.setName(name);
            map(sheet, "identity").put("name", name);
        }
        if (request.portraitUrl() != null) {
            String portrait = normalizeNullable(request.portraitUrl());
            entity.setPortraitUrl(portrait);
            map(sheet, "identity").put("portraitUrl", portrait == null ? "" : portrait);
        }
        if (request.currentHp() != null) {
            entity.setCurrentHp(request.currentHp());
            map(sheet, "combat").put("currentHp", request.currentHp());
        }
        if (request.tempHp() != null) {
            entity.setTempHp(request.tempHp());
            map(sheet, "combat").put("tempHp", request.tempHp());
        }
        if (request.privateNotes() != null) {
            entity.setPrivateNotes(request.privateNotes().trim());
            map(sheet, "notes").put("privateNotes", request.privateNotes().trim());
        }
        if (request.inventory() != null) {
            sheet.put("inventory", request.inventory());
        }

        entity.setSheetJson(writeSheet(sheet));
        return toDetails(playerCharacterRepository.save(entity));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> compendiumClasses() {
        return compendiumService.classes();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> compendiumRaces() {
        return compendiumService.races();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> compendiumBackgrounds() {
        return compendiumService.backgrounds();
    }

    @Transactional
    public void delete(Long userId, Long characterId) {
        playerCharacterRepository.delete(requireOwnedCharacter(userId, characterId));
    }

    private PlayerCharacterEntity requireOwnedCharacter(Long userId, Long characterId) {
        return playerCharacterRepository.findByIdAndOwnerUserId(characterId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
    }

    private PlayerCharacterSummaryResponse toSummary(PlayerCharacterEntity entity) {
        return new PlayerCharacterSummaryResponse(
                entity.getId(),
                entity.getSystemCode(),
                entity.getName(),
                entity.getStatus(),
                entity.getLevel(),
                entity.getRaceName(),
                entity.getClassName(),
                entity.getPortraitUrl(),
                entity.getUpdatedAt()
        );
    }

    private PlayerCharacterDetailsResponse toDetails(PlayerCharacterEntity entity) {
        return new PlayerCharacterDetailsResponse(
                entity.getId(),
                entity.getSystemCode(),
                entity.getName(),
                entity.getStatus(),
                entity.getPortraitUrl(),
                entity.getRaceName(),
                entity.getClassName(),
                entity.getBackgroundName(),
                entity.getLevel(),
                entity.getCurrentHp(),
                entity.getTempHp(),
                entity.getPrivateNotes(),
                readSheet(entity.getSheetJson()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String labelFromSnapshot(Map<String, Object> sheet, String key) {
        Map<String, Object> snapshots = map(sheet, "snapshots");
        Object raw = snapshots.get(key);
        if (raw instanceof Map<?, ?> item) {
            Object label = item.get("name");
            return label == null ? "" : String.valueOf(label);
        }
        return "";
    }

    private int intFromCombat(Map<String, Object> sheet, String key, int fallback) {
        Object value = map(sheet, "combat").get(key);
        if (value instanceof Number number) return number.intValue();
        return fallback;
    }

    private int intValue(Object value, int fallback) {
        if (value instanceof Number number) return number.intValue();
        return fallback;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> map(Map<String, Object> root, String key) {
        Object value = root.get(key);
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        Map<String, Object> created = new LinkedHashMap<>();
        root.put(key, created);
        return created;
    }

    private String writeSheet(Map<String, Object> sheet) {
        try {
            return objectMapper.writeValueAsString(sheet);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize character sheet");
        }
    }

    private Map<String, Object> readSheet(String raw) {
        if (raw == null || raw.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {});
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}

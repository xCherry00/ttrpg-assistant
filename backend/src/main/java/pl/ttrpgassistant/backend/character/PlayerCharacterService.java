package pl.ttrpgassistant.backend.character;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterDetailsResponse;
import pl.ttrpgassistant.backend.character.dto.PlayerCharacterSummaryResponse;
import pl.ttrpgassistant.backend.character.dto.UpsertPlayerCharacterRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class PlayerCharacterService {

    private final PlayerCharacterRepository playerCharacterRepository;

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
    public PlayerCharacterDetailsResponse create(Long userId, UpsertPlayerCharacterRequest request) {
        PlayerCharacterEntity entity = PlayerCharacterEntity.builder()
                .ownerUserId(userId)
                .name(request.name().trim())
                .build();

        applyRequest(entity, request);
        return toDetails(playerCharacterRepository.save(entity));
    }

    @Transactional
    public PlayerCharacterDetailsResponse update(Long userId, Long characterId, UpsertPlayerCharacterRequest request) {
        PlayerCharacterEntity entity = requireOwnedCharacter(userId, characterId);
        entity.setName(request.name().trim());
        applyRequest(entity, request);
        return toDetails(playerCharacterRepository.save(entity));
    }

    @Transactional
    public void delete(Long userId, Long characterId) {
        playerCharacterRepository.delete(requireOwnedCharacter(userId, characterId));
    }

    private void applyRequest(PlayerCharacterEntity entity, UpsertPlayerCharacterRequest request) {
        entity.setSystemCode("dnd5e");
        entity.setStatus(normalizeStatus(request.status()));
        entity.setPortraitUrl(normalizeNullable(request.portraitUrl()));
        entity.setRaceName(normalize(request.raceName()));
        entity.setSubraceName(normalize(request.subraceName()));
        entity.setClassName(normalize(request.className()));
        entity.setSubclassName(normalize(request.subclassName()));
        entity.setBackgroundName(normalize(request.backgroundName()));
        entity.setAlignment(normalize(request.alignment()));
        entity.setLevel(orDefault(request.level(), 1));
        entity.setExperiencePoints(orDefault(request.experiencePoints(), 0));
        entity.setAbilityMode(normalizeAbilityMode(request.abilityMode()));
        entity.setStrength(orDefault(request.strength(), 10));
        entity.setDexterity(orDefault(request.dexterity(), 10));
        entity.setConstitution(orDefault(request.constitution(), 10));
        entity.setIntelligence(orDefault(request.intelligence(), 10));
        entity.setWisdom(orDefault(request.wisdom(), 10));
        entity.setCharisma(orDefault(request.charisma(), 10));
        entity.setMaxHp(orDefault(request.maxHp(), 1));
        entity.setCurrentHp(orDefault(request.currentHp(), entity.getMaxHp()));
        entity.setTempHp(orDefault(request.tempHp(), 0));
        entity.setArmorClass(orDefault(request.armorClass(), 10));
        entity.setInitiativeBonus(orDefault(request.initiativeBonus(), 0));
        entity.setSpeed(orDefault(request.speed(), 30));
        entity.setProficiencyBonus(orDefault(request.proficiencyBonus(), 2));
        entity.setHitDice(normalize(request.hitDice()));
        entity.setSkillNotes(normalizeLarge(request.skillNotes()));
        entity.setSavingThrowNotes(normalizeLarge(request.savingThrowNotes()));
        entity.setEquipmentNotes(normalizeLarge(request.equipmentNotes()));
        entity.setFeatureNotes(normalizeLarge(request.featureNotes()));
        entity.setPersonalityNotes(normalizeLarge(request.personalityNotes()));
        entity.setPrivateNotes(normalizeLarge(request.privateNotes()));
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
                entity.getSubraceName(),
                entity.getClassName(),
                entity.getSubclassName(),
                entity.getBackgroundName(),
                entity.getAlignment(),
                entity.getLevel(),
                entity.getExperiencePoints(),
                entity.getAbilityMode(),
                entity.getStrength(),
                entity.getDexterity(),
                entity.getConstitution(),
                entity.getIntelligence(),
                entity.getWisdom(),
                entity.getCharisma(),
                entity.getMaxHp(),
                entity.getCurrentHp(),
                entity.getTempHp(),
                entity.getArmorClass(),
                entity.getInitiativeBonus(),
                entity.getSpeed(),
                entity.getProficiencyBonus(),
                entity.getHitDice(),
                entity.getSkillNotes(),
                entity.getSavingThrowNotes(),
                entity.getEquipmentNotes(),
                entity.getFeatureNotes(),
                entity.getPersonalityNotes(),
                entity.getPrivateNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeLarge(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Integer orDefault(Integer value, Integer fallback) {
        return value == null ? fallback : value;
    }

    private String normalizeStatus(String value) {
        if (value == null || value.isBlank()) {
            return "DRAFT";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACTIVE", "ARCHIVED", "DRAFT" -> normalized;
            default -> "DRAFT";
        };
    }

    private String normalizeAbilityMode(String value) {
        if (value == null || value.isBlank()) {
            return "MANUAL";
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "STANDARD_ARRAY", "ROLLED", "MANUAL" -> normalized;
            default -> "MANUAL";
        };
    }
}

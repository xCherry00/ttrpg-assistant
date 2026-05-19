package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.AddCombatParticipantRequest;
import pl.ttrpgassistant.backend.campaign.dto.CombatEncounterResponse;
import pl.ttrpgassistant.backend.campaign.dto.CombatParticipantResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateCombatEncounterRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCombatParticipantRequest;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CombatEncounterService {

    private static final Set<String> ENCOUNTER_STATUSES = Set.of("ACTIVE", "FINISHED", "ARCHIVED");
    private static final Set<String> PARTICIPANT_TYPES = Set.of("PLAYER_CHARACTER", "NPC", "MONSTER", "CUSTOM");

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CampaignCharacterRepository campaignCharacterRepository;
    private final PlayerCharacterRepository playerCharacterRepository;
    private final CombatEncounterRepository combatEncounterRepository;
    private final CombatParticipantRepository combatParticipantRepository;

    @Transactional
    public CombatEncounterResponse createEncounter(Long userId, Long campaignId, CreateCombatEncounterRequest request) {
        requireOwnerAccess(userId, campaignId);
        Long sessionId = validateSessionId(campaignId, request.sessionId());

        CombatEncounterEntity saved = combatEncounterRepository.save(CombatEncounterEntity.builder()
                .campaignId(campaignId)
                .sessionId(sessionId)
                .name(request.name().trim())
                .systemCode(normalizeSystemCode(request.systemCode()))
                .status("ACTIVE")
                .currentTurnIndex(0)
                .roundNumber(1)
                .createdByUserId(userId)
                .build());

        return toResponse(saved, List.of());
    }

    @Transactional(readOnly = true)
    public List<CombatEncounterResponse> listEncounters(Long userId, Long campaignId) {
        requireMemberAccess(userId, campaignId);
        return combatEncounterRepository.findByCampaignIdAndDeletedAtIsNullOrderByUpdatedAtDescCreatedAtDesc(campaignId).stream()
                .map(encounter -> toResponse(encounter, loadSortedParticipants(encounter.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CombatEncounterResponse getEncounter(Long userId, Long campaignId, Long encounterId) {
        requireMemberAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public CombatEncounterResponse addParticipant(Long userId, Long campaignId, Long encounterId, AddCombatParticipantRequest request) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        ParticipantInput input = resolveParticipantInput(campaignId, request);
        int nextSortOrder = combatParticipantRepository.findByEncounterId(encounter.getId()).stream()
                .map(CombatParticipantEntity::getSortOrder)
                .max(Integer::compareTo)
                .orElse(-1) + 1;

        combatParticipantRepository.save(CombatParticipantEntity.builder()
                .encounterId(encounter.getId())
                .characterId(input.characterId())
                .name(input.name())
                .participantType(input.participantType())
                .initiativeValue(input.initiativeValue())
                .initiativeModifier(input.initiativeModifier())
                .sortOrder(nextSortOrder)
                .active(true)
                .defeated(false)
                .notes(input.notes())
                .build());

        refreshEncounterPointers(encounter, loadSortedParticipants(encounter.getId()));
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public CombatEncounterResponse updateParticipant(Long userId, Long campaignId, Long encounterId, Long participantId, UpdateCombatParticipantRequest request) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        CombatParticipantEntity participant = requireParticipant(encounterId, participantId);
        if (request.name() != null && !request.name().isBlank()) {
            participant.setName(request.name().trim());
        }
        if (request.initiativeValue() != null) {
            participant.setInitiativeValue(request.initiativeValue());
        }
        if (request.initiativeModifier() != null) {
            participant.setInitiativeModifier(request.initiativeModifier());
        }
        if (request.isActive() != null) {
            participant.setActive(request.isActive());
        }
        if (request.isDefeated() != null) {
            participant.setDefeated(request.isDefeated());
        }
        if (request.notes() != null) {
            participant.setNotes(request.notes());
        }
        combatParticipantRepository.save(participant);

        refreshEncounterPointers(encounter, loadSortedParticipants(encounter.getId()));
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public CombatEncounterResponse removeParticipant(Long userId, Long campaignId, Long encounterId, Long participantId) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        CombatParticipantEntity participant = requireParticipant(encounterId, participantId);
        participant.setActive(false);
        combatParticipantRepository.save(participant);

        refreshEncounterPointers(encounter, loadSortedParticipants(encounter.getId()));
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public CombatEncounterResponse reorderParticipants(Long userId, Long campaignId, Long encounterId, List<Long> participantIds) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        List<CombatParticipantEntity> participants = combatParticipantRepository.findByEncounterId(encounterId);
        Map<Long, CombatParticipantEntity> byId = participants.stream()
                .collect(Collectors.toMap(CombatParticipantEntity::getId, Function.identity()));

        int index = 0;
        for (Long participantId : participantIds) {
            CombatParticipantEntity participant = byId.get(participantId);
            if (participant != null) {
                participant.setSortOrder(index++);
            }
        }
        for (CombatParticipantEntity participant : participants) {
            if (!participantIds.contains(participant.getId())) {
                participant.setSortOrder(index++);
            }
        }
        combatParticipantRepository.saveAll(participants);
        refreshEncounterPointers(encounter, loadSortedParticipants(encounter.getId()));
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public CombatEncounterResponse nextTurn(Long userId, Long campaignId, Long encounterId) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        List<CombatParticipantEntity> sorted = loadSortedParticipants(encounter.getId());
        List<CombatParticipantEntity> active = activeParticipants(sorted);
        if (active.isEmpty()) {
            throw new IllegalArgumentException("No active participants in this encounter.");
        }

        int current = normalizeTurnIndex(encounter.getCurrentTurnIndex(), active.size());
        int next = (current + 1) % active.size();
        if (next == 0) {
            encounter.setRoundNumber(Math.max(1, encounter.getRoundNumber()) + 1);
        }
        encounter.setCurrentTurnIndex(next);
        combatEncounterRepository.save(encounter);
        return toResponse(encounter, sorted);
    }

    @Transactional
    public CombatEncounterResponse previousTurn(Long userId, Long campaignId, Long encounterId) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        ensureEncounterMutable(encounter);

        List<CombatParticipantEntity> sorted = loadSortedParticipants(encounter.getId());
        List<CombatParticipantEntity> active = activeParticipants(sorted);
        if (active.isEmpty()) {
            throw new IllegalArgumentException("No active participants in this encounter.");
        }

        int current = normalizeTurnIndex(encounter.getCurrentTurnIndex(), active.size());
        int previous = current == 0 ? active.size() - 1 : current - 1;
        if (current == 0 && encounter.getRoundNumber() > 1) {
            encounter.setRoundNumber(encounter.getRoundNumber() - 1);
        }
        encounter.setCurrentTurnIndex(previous);
        combatEncounterRepository.save(encounter);
        return toResponse(encounter, sorted);
    }

    @Transactional
    public CombatEncounterResponse finishEncounter(Long userId, Long campaignId, Long encounterId) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        encounter.setStatus("FINISHED");
        combatEncounterRepository.save(encounter);
        return toResponse(encounter, loadSortedParticipants(encounter.getId()));
    }

    @Transactional
    public void softDeleteEncounter(Long userId, Long campaignId, Long encounterId) {
        requireOwnerAccess(userId, campaignId);
        CombatEncounterEntity encounter = requireEncounter(campaignId, encounterId);
        if (encounter.getDeletedAt() == null) {
            encounter.setDeletedAt(Instant.now());
            combatEncounterRepository.save(encounter);
        }
    }

    private ParticipantInput resolveParticipantInput(Long campaignId, AddCombatParticipantRequest request) {
        if (request.characterId() != null) {
            if (!campaignCharacterRepository.existsByIdCampaignIdAndIdCharacterIdAndActiveTrue(campaignId, request.characterId())) {
                throw new IllegalArgumentException("Character is not assigned to this campaign.");
            }
            PlayerCharacterEntity character = playerCharacterRepository.findById(request.characterId())
                    .orElseThrow(() -> new ResourceNotFoundException("Character not found"));
            String name = request.name() == null || request.name().isBlank() ? character.getName() : request.name().trim();
            int init = request.initiativeValue() == null ? 0 : request.initiativeValue();
            Integer mod = request.initiativeModifier();
            return new ParticipantInput(character.getId(), name, "PLAYER_CHARACTER", init, mod, request.notes());
        }

        String type = normalizeParticipantType(request.participantType());
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Participant name is required.");
        }
        if (request.initiativeValue() == null) {
            throw new IllegalArgumentException("initiativeValue is required.");
        }
        return new ParticipantInput(null, request.name().trim(), type, request.initiativeValue(), request.initiativeModifier(), request.notes());
    }

    private void ensureEncounterMutable(CombatEncounterEntity encounter) {
        if (!"ACTIVE".equals(encounter.getStatus())) {
            throw new IllegalArgumentException("Encounter is not active.");
        }
    }

    private void refreshEncounterPointers(CombatEncounterEntity encounter, List<CombatParticipantEntity> sorted) {
        List<CombatParticipantEntity> active = activeParticipants(sorted);
        if (active.isEmpty()) {
            encounter.setCurrentTurnIndex(0);
        } else {
            int normalized = normalizeTurnIndex(encounter.getCurrentTurnIndex(), active.size());
            encounter.setCurrentTurnIndex(normalized);
        }
        combatEncounterRepository.save(encounter);
    }

    private int normalizeTurnIndex(Integer raw, int size) {
        if (size <= 0) {
            return 0;
        }
        int value = raw == null ? 0 : raw;
        if (value < 0) {
            return 0;
        }
        if (value >= size) {
            return 0;
        }
        return value;
    }

    private List<CombatParticipantEntity> activeParticipants(List<CombatParticipantEntity> sorted) {
        return sorted.stream()
                .filter(item -> item.isActive() && !item.isDefeated())
                .toList();
    }

    private CombatEncounterEntity requireEncounter(Long campaignId, Long encounterId) {
        return combatEncounterRepository.findByIdAndCampaignIdAndDeletedAtIsNull(encounterId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Encounter not found"));
    }

    private CombatParticipantEntity requireParticipant(Long encounterId, Long participantId) {
        return combatParticipantRepository.findById(participantId)
                .filter(item -> item.getEncounterId().equals(encounterId))
                .orElseThrow(() -> new ResourceNotFoundException("Participant not found"));
    }

    private CampaignEntity requireMemberAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        if (campaign.getOwnerUserId().equals(userId)) {
            return campaign;
        }
        if (!campaignMemberRepository.existsById(new CampaignMemberId(campaignId, userId))) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private CampaignEntity requireOwnerAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        if (!campaign.getOwnerUserId().equals(userId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private Long validateSessionId(Long campaignId, Long sessionId) {
        if (sessionId == null) {
            return null;
        }
        campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new IllegalArgumentException("Session does not belong to campaign."));
        return sessionId;
    }

    private List<CombatParticipantEntity> loadSortedParticipants(Long encounterId) {
        return combatParticipantRepository.findByEncounterId(encounterId).stream()
                .sorted(participantComparator())
                .toList();
    }

    private Comparator<CombatParticipantEntity> participantComparator() {
        return Comparator
                .comparing(CombatParticipantEntity::getInitiativeValue, Comparator.nullsLast(Integer::compareTo)).reversed()
                .thenComparing(item -> item.getInitiativeModifier() == null ? Integer.MIN_VALUE : item.getInitiativeModifier(), Comparator.reverseOrder())
                .thenComparing(CombatParticipantEntity::getSortOrder)
                .thenComparing(CombatParticipantEntity::getId);
    }

    private CombatEncounterResponse toResponse(CombatEncounterEntity encounter, List<CombatParticipantEntity> participants) {
        List<CombatParticipantEntity> active = activeParticipants(participants);
        int currentIndex = normalizeTurnIndex(encounter.getCurrentTurnIndex(), active.size());
        Long currentParticipantId = active.isEmpty() ? null : active.get(currentIndex).getId();

        List<CombatParticipantResponse> participantResponses = participants.stream()
                .map(item -> new CombatParticipantResponse(
                        item.getId(),
                        item.getCharacterId(),
                        item.getName(),
                        item.getParticipantType(),
                        item.getInitiativeValue(),
                        item.getInitiativeModifier(),
                        item.getSortOrder(),
                        item.isActive(),
                        item.isDefeated(),
                        item.getNotes()
                ))
                .toList();

        return new CombatEncounterResponse(
                encounter.getId(),
                encounter.getCampaignId(),
                encounter.getSessionId(),
                encounter.getName(),
                encounter.getSystemCode(),
                encounter.getStatus(),
                Math.max(1, encounter.getRoundNumber()),
                currentIndex,
                currentParticipantId,
                participantResponses
        );
    }

    private String normalizeSystemCode(String rawSystemCode) {
        String normalized = rawSystemCode == null ? "" : rawSystemCode.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException("systemCode is required.");
        }
        return normalized;
    }

    private String normalizeParticipantType(String rawType) {
        String normalized = rawType == null || rawType.isBlank() ? "CUSTOM" : rawType.trim().toUpperCase(Locale.ROOT);
        if (!PARTICIPANT_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported participant type.");
        }
        return normalized;
    }

    private record ParticipantInput(
            Long characterId,
            String name,
            String participantType,
            Integer initiativeValue,
            Integer initiativeModifier,
            String notes
    ) {}
}

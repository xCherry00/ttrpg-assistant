package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.CreateDiceRollRequest;
import pl.ttrpgassistant.backend.campaign.dto.DiceRollResponse;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DiceRollService {

    private static final Set<String> ROLL_TYPES = Set.of("GENERIC", "ATTACK", "DAMAGE", "SAVE", "SKILL", "INITIATIVE", "CUSTOM");

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CampaignCharacterRepository campaignCharacterRepository;
    private final CombatEncounterRepository combatEncounterRepository;
    private final CombatParticipantRepository combatParticipantRepository;
    private final UserRepository userRepository;
    private final DiceRollRepository diceRollRepository;
    private final DiceExpressionParser diceExpressionParser;

    @Transactional
    public DiceRollResponse createRoll(Long userId, Long campaignId, CreateDiceRollRequest request) {
        requireMemberAccess(userId, campaignId);
        validateReferences(campaignId, request.sessionId(), request.encounterId(), request.participantId(), request.characterId());

        DiceExpressionParser.DiceRollComputation rolled = diceExpressionParser.parseAndRoll(request.rollExpression());
        String rollType = normalizeRollType(request.rollType());

        DiceRollEntity entity = diceRollRepository.save(DiceRollEntity.builder()
                .campaignId(campaignId)
                .sessionId(request.sessionId())
                .encounterId(request.encounterId())
                .participantId(request.participantId())
                .characterId(request.characterId())
                .rolledByUserId(userId)
                .rollLabel(trimToNull(request.rollLabel()))
                .rollExpression(rolled.normalizedExpression())
                .rollType(rollType)
                .total(rolled.total())
                .diceResults(rolled.diceResults())
                .modifier(rolled.modifier())
                .isPrivate(Boolean.TRUE.equals(request.isPrivate()))
                .build());

        UserEntity author = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toResponse(entity, author);
    }

    @Transactional(readOnly = true)
    public List<DiceRollResponse> listRolls(Long userId, Long campaignId, Integer limit, Long sessionId, Long encounterId, Long characterId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        int safeLimit = normalizeLimit(limit);
        List<DiceRollEntity> all = diceRollRepository.findForCampaignFilters(campaignId, sessionId, encounterId, characterId);

        return all.stream()
                .filter(roll -> canViewRoll(campaign, userId, roll))
                .limit(safeLimit)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DiceRollResponse getRoll(Long userId, Long campaignId, Long rollId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        DiceRollEntity roll = diceRollRepository.findByIdAndCampaignIdAndDeletedAtIsNull(rollId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Dice roll not found"));
        if (!canViewRoll(campaign, userId, roll)) {
            throw new ResourceNotFoundException("Dice roll not found");
        }
        return toResponse(roll);
    }

    @Transactional
    public void softDeleteRoll(Long userId, Long campaignId, Long rollId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        DiceRollEntity roll = diceRollRepository.findByIdAndCampaignIdAndDeletedAtIsNull(rollId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Dice roll not found"));

        boolean owner = campaign.getOwnerUserId().equals(userId);
        boolean author = roll.getRolledByUserId().equals(userId);
        if (!owner && !author) {
            throw new ResourceNotFoundException("Dice roll not found");
        }

        roll.setDeletedAt(Instant.now());
        diceRollRepository.save(roll);
    }

    private void validateReferences(Long campaignId, Long sessionId, Long encounterId, Long participantId, Long characterId) {
        if (sessionId != null) {
            campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                    .orElseThrow(() -> new IllegalArgumentException("Session does not belong to campaign."));
        }
        if (encounterId != null) {
            combatEncounterRepository.findByIdAndCampaignIdAndDeletedAtIsNull(encounterId, campaignId)
                    .orElseThrow(() -> new IllegalArgumentException("Encounter does not belong to campaign."));
        }
        if (participantId != null) {
            CombatParticipantEntity participant = combatParticipantRepository.findById(participantId)
                    .orElseThrow(() -> new IllegalArgumentException("Participant not found."));
            CombatEncounterEntity participantEncounter = combatEncounterRepository
                    .findByIdAndCampaignIdAndDeletedAtIsNull(participant.getEncounterId(), campaignId)
                    .orElseThrow(() -> new IllegalArgumentException("Participant does not belong to campaign encounter."));
            if (encounterId != null && !participantEncounter.getId().equals(encounterId)) {
                throw new IllegalArgumentException("Participant does not belong to provided encounter.");
            }
        }
        if (characterId != null && !campaignCharacterRepository.existsByIdCampaignIdAndIdCharacterIdAndActiveTrue(campaignId, characterId)) {
            throw new IllegalArgumentException("Character must be assigned to campaign.");
        }
    }

    private boolean canViewRoll(CampaignEntity campaign, Long userId, DiceRollEntity roll) {
        if (!roll.isPrivate()) {
            return true;
        }
        return campaign.getOwnerUserId().equals(userId) || roll.getRolledByUserId().equals(userId);
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return 50;
        }
        if (limit < 1) {
            return 1;
        }
        return Math.min(limit, 200);
    }

    private String normalizeRollType(String rawType) {
        String normalized = rawType == null || rawType.isBlank() ? "GENERIC" : rawType.trim().toUpperCase(Locale.ROOT);
        if (!ROLL_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported roll type.");
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private DiceRollResponse toResponse(DiceRollEntity entity) {
        UserEntity author = userRepository.findById(entity.getRolledByUserId()).orElse(null);
        return toResponse(entity, author);
    }

    private DiceRollResponse toResponse(DiceRollEntity entity, UserEntity author) {
        return new DiceRollResponse(
                entity.getId(),
                entity.getCampaignId(),
                entity.getSessionId(),
                entity.getEncounterId(),
                entity.getParticipantId(),
                entity.getCharacterId(),
                entity.getRolledByUserId(),
                author == null ? null : author.getUsername(),
                entity.getRollLabel(),
                entity.getRollExpression(),
                entity.getRollType(),
                entity.getTotal(),
                entity.getDiceResults(),
                entity.getModifier(),
                entity.isPrivate(),
                entity.getCreatedAt()
        );
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
}

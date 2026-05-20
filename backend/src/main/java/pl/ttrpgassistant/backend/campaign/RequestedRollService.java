package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.CreateRequestedRollRequest;
import pl.ttrpgassistant.backend.campaign.dto.FulfillRequestedRollRequest;
import pl.ttrpgassistant.backend.campaign.dto.RequestedRollResponse;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.character.PlayerCharacterEntity;
import pl.ttrpgassistant.backend.character.PlayerCharacterRepository;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RequestedRollService {
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CampaignCharacterRepository campaignCharacterRepository;
    private final PlayerCharacterRepository playerCharacterRepository;
    private final UserRepository userRepository;
    private final RequestedRollRepository requestedRollRepository;
    private final DiceRollRepository diceRollRepository;
    private final DiceExpressionParser diceExpressionParser;

    @Transactional
    public List<RequestedRollResponse> create(Long userId, Long campaignId, Long sessionId, CreateRequestedRollRequest request) {
        CampaignEntity campaign = requireSessionOwnerInProgress(userId, campaignId, sessionId);
        String targetMode = normalizeTargetMode(request.targetMode());
        String rollType = normalizeRollType(request.rollType());
        String label = requireText(request.rollLabel(), "Roll label is required");
        Integer dc = request.dc();
        if (dc != null && dc < 0) {
            throw new IllegalArgumentException("DC must be >= 0");
        }
        boolean isDcHidden = request.isDcHidden() == null || request.isDcHidden();
        boolean showSuccessToPlayer = request.showSuccessToPlayer() != null && request.showSuccessToPlayer();

        List<RequestedRollEntity> rows = switch (targetMode) {
            case "CHARACTER" -> createForCharacters(campaign, sessionId, userId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer);
            case "USER" -> createForUsers(campaign, sessionId, userId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer);
            default -> createForAllCharacters(campaign, sessionId, userId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer);
        };
        List<RequestedRollEntity> saved = requestedRollRepository.saveAll(rows);
        return list(userId, campaignId, sessionId).stream()
                .filter(item -> saved.stream().anyMatch(savedRow -> savedRow.getId().equals(item.id())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RequestedRollResponse> list(Long userId, Long campaignId, Long sessionId) {
        CampaignEntity campaign = requireMemberSession(userId, campaignId, sessionId);
        List<RequestedRollEntity> all = requestedRollRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
        boolean owner = campaign.getOwnerUserId().equals(userId);
        Set<Long> myCharacterIds = playerCharacterRepository.findByOwnerUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(PlayerCharacterEntity::getId).collect(Collectors.toSet());

        List<RequestedRollEntity> visible = owner ? all : all.stream()
                .filter(row -> Objects.equals(row.getTargetUserId(), userId) || (row.getTargetCharacterId() != null && myCharacterIds.contains(row.getTargetCharacterId())))
                .toList();
        return toResponses(userId, campaign, visible);
    }

    @Transactional
    public RequestedRollResponse fulfill(Long userId, Long campaignId, Long sessionId, Long requestId, FulfillRequestedRollRequest request) {
        CampaignEntity campaign = requireMemberSession(userId, campaignId, sessionId);
        CampaignSessionEntity session = requireSession(campaignId, sessionId);
        requireSessionInProgress(session);
        RequestedRollEntity row = requireRequestedRoll(campaignId, sessionId, requestId);
        if (!"PENDING".equals(row.getStatus())) {
            throw new IllegalArgumentException("Requested roll is not pending.");
        }
        boolean owner = campaign.getOwnerUserId().equals(userId);
        boolean targetUser = Objects.equals(row.getTargetUserId(), userId);
        boolean targetCharacterOwner = row.getTargetCharacterId() != null
                && playerCharacterRepository.findById(row.getTargetCharacterId()).map(character -> Objects.equals(character.getOwnerUserId(), userId)).orElse(false);
        if (!owner && !targetUser && !targetCharacterOwner) {
            throw new ResourceNotFoundException("Requested roll not found");
        }

        String baseExpression = chooseExpression(campaign.getSystemCode(), request.rollExpression(), row.getRollExpression());
        DiceExpressionParser.DiceRollComputation rolled = diceExpressionParser.parseAndRoll(baseExpression);
        int manualModifier = request.manualModifier() == null ? 0 : request.manualModifier();
        int total = rolled.total() + manualModifier;
        int modifier = rolled.modifier() + manualModifier;

        DiceRollEntity savedRoll = diceRollRepository.save(DiceRollEntity.builder()
                .campaignId(campaignId)
                .sessionId(sessionId)
                .characterId(row.getTargetCharacterId())
                .rolledByUserId(userId)
                .rollLabel(row.getRollLabel())
                .rollExpression(rolled.normalizedExpression())
                .rollType(normalizeRollType(row.getRollType()))
                .total(total)
                .diceResults(rolled.diceResults())
                .modifier(modifier)
                .isPrivate(false)
                .build());

        row.setFulfilledRollId(savedRoll.getId());
        row.setStatus("FULFILLED");
        row.setResolvedAt(Instant.now());
        requestedRollRepository.save(row);

        return toResponses(userId, campaign, List.of(row)).get(0);
    }

    @Transactional
    public RequestedRollResponse cancel(Long userId, Long campaignId, Long sessionId, Long requestId) {
        requireSessionOwnerInProgress(userId, campaignId, sessionId);
        RequestedRollEntity row = requireRequestedRoll(campaignId, sessionId, requestId);
        if (!"PENDING".equals(row.getStatus())) {
            throw new IllegalArgumentException("Only pending requested roll can be cancelled.");
        }
        row.setStatus("CANCELLED");
        row.setCancelledAt(Instant.now());
        requestedRollRepository.save(row);
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId).orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        return toResponses(userId, campaign, List.of(row)).get(0);
    }

    private List<RequestedRollEntity> createForCharacters(CampaignEntity campaign, Long sessionId, Long requestedByUserId, CreateRequestedRollRequest request,
                                                           String label, String rollType, Integer dc, boolean isDcHidden, boolean showSuccessToPlayer) {
        List<Long> ids = request.targetCharacterIds();
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("targetCharacterIds are required for CHARACTER mode.");
        }
        List<RequestedRollEntity> rows = new ArrayList<>();
        for (Long characterId : ids) {
            CampaignCharacterEntity assignment = campaignCharacterRepository.findByIdCampaignIdAndIdCharacterId(campaign.getId(), characterId)
                    .filter(CampaignCharacterEntity::isActive)
                    .orElseThrow(() -> new IllegalArgumentException("Target character must be assigned to campaign."));
            PlayerCharacterEntity character = playerCharacterRepository.findById(characterId)
                    .orElseThrow(() -> new IllegalArgumentException("Character not found."));
            if (!campaign.getSystemCode().equalsIgnoreCase(character.getSystemCode())) {
                throw new IllegalArgumentException("Target character system must match campaign system.");
            }
            rows.add(buildRow(campaign.getId(), sessionId, assignment.getUserId(), characterId, requestedByUserId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer));
        }
        return rows;
    }

    private List<RequestedRollEntity> createForUsers(CampaignEntity campaign, Long sessionId, Long requestedByUserId, CreateRequestedRollRequest request,
                                                      String label, String rollType, Integer dc, boolean isDcHidden, boolean showSuccessToPlayer) {
        List<Long> ids = request.targetUserIds();
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("targetUserIds are required for USER mode.");
        }
        List<RequestedRollEntity> rows = new ArrayList<>();
        for (Long targetUserId : ids) {
            if (!campaign.getOwnerUserId().equals(targetUserId) && !campaignMemberRepository.existsById(new CampaignMemberId(campaign.getId(), targetUserId))) {
                throw new IllegalArgumentException("Target user must be a campaign member.");
            }
            rows.add(buildRow(campaign.getId(), sessionId, targetUserId, null, requestedByUserId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer));
        }
        return rows;
    }

    private List<RequestedRollEntity> createForAllCharacters(CampaignEntity campaign, Long sessionId, Long requestedByUserId, CreateRequestedRollRequest request,
                                                              String label, String rollType, Integer dc, boolean isDcHidden, boolean showSuccessToPlayer) {
        List<CampaignCharacterEntity> assignments = campaignCharacterRepository.findByIdCampaignIdAndActiveTrueOrderByAssignedAtAsc(campaign.getId());
        if (assignments.isEmpty()) {
            throw new IllegalArgumentException("No assigned characters for ALL mode.");
        }
        List<RequestedRollEntity> rows = new ArrayList<>();
        for (CampaignCharacterEntity assignment : assignments) {
            PlayerCharacterEntity character = playerCharacterRepository.findById(assignment.getId().getCharacterId())
                    .orElse(null);
            if (character == null || !campaign.getSystemCode().equalsIgnoreCase(character.getSystemCode())) {
                continue;
            }
            rows.add(buildRow(campaign.getId(), sessionId, assignment.getUserId(), assignment.getId().getCharacterId(),
                    requestedByUserId, request, label, rollType, dc, isDcHidden, showSuccessToPlayer));
        }
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("No compatible assigned characters for ALL mode.");
        }
        return rows;
    }

    private RequestedRollEntity buildRow(Long campaignId, Long sessionId, Long targetUserId, Long targetCharacterId, Long requestedByUserId,
                                         CreateRequestedRollRequest request, String label, String rollType, Integer dc,
                                         boolean isDcHidden, boolean showSuccessToPlayer) {
        return RequestedRollEntity.builder()
                .campaignId(campaignId)
                .sessionId(sessionId)
                .targetUserId(targetUserId)
                .targetCharacterId(targetCharacterId)
                .requestedByUserId(requestedByUserId)
                .rollLabel(label)
                .rollType(rollType)
                .rollExpression(trimToNull(request.rollExpression()))
                .abilityKey(trimToNull(request.abilityKey()))
                .skillKey(trimToNull(request.skillKey()))
                .dc(dc)
                .isDcHidden(isDcHidden)
                .showSuccessToPlayer(showSuccessToPlayer)
                .status("PENDING")
                .build();
    }

    private List<RequestedRollResponse> toResponses(Long currentUserId, CampaignEntity campaign, List<RequestedRollEntity> rows) {
        Map<Long, UserEntity> users = userRepository.findAllById(rows.stream()
                        .flatMap(row -> Arrays.stream(new Long[]{row.getTargetUserId(), row.getRequestedByUserId()}))
                        .filter(Objects::nonNull).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));
        Map<Long, PlayerCharacterEntity> characters = playerCharacterRepository.findAllById(rows.stream()
                        .map(RequestedRollEntity::getTargetCharacterId).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(PlayerCharacterEntity::getId, Function.identity()));
        Map<Long, DiceRollEntity> rolls = diceRollRepository.findAllById(rows.stream()
                        .map(RequestedRollEntity::getFulfilledRollId).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(DiceRollEntity::getId, Function.identity()));

        boolean owner = campaign.getOwnerUserId().equals(currentUserId);
        return rows.stream().map(row -> {
            UserEntity targetUser = row.getTargetUserId() == null ? null : users.get(row.getTargetUserId());
            PlayerCharacterEntity targetCharacter = row.getTargetCharacterId() == null ? null : characters.get(row.getTargetCharacterId());
            DiceRollEntity fulfilled = row.getFulfilledRollId() == null ? null : rolls.get(row.getFulfilledRollId());
            boolean dcVisible = owner || !row.isDcHidden();
            Integer dc = dcVisible ? row.getDc() : null;
            Integer result = fulfilled == null ? null : fulfilled.getTotal();
            Boolean success = null;
            if (result != null && row.getDc() != null && (owner || row.isShowSuccessToPlayer())) {
                success = result >= row.getDc();
            }
            return new RequestedRollResponse(
                    row.getId(),
                    row.getCampaignId(),
                    row.getSessionId(),
                    row.getTargetUserId(),
                    row.getTargetCharacterId(),
                    targetUser == null ? null : displayNameFor(targetUser),
                    targetCharacter == null ? null : targetCharacter.getName(),
                    row.getRequestedByUserId(),
                    row.getFulfilledRollId(),
                    row.getRollLabel(),
                    row.getRollType(),
                    row.getRollExpression(),
                    row.getAbilityKey(),
                    row.getSkillKey(),
                    dcVisible,
                    dc,
                    row.isDcHidden(),
                    row.isShowSuccessToPlayer(),
                    row.getStatus(),
                    result,
                    success,
                    row.getCreatedAt(),
                    row.getResolvedAt()
            );
        }).toList();
    }

    private CampaignEntity requireSessionOwnerInProgress(Long userId, Long campaignId, Long sessionId) {
        CampaignEntity campaign = requireMemberSession(userId, campaignId, sessionId);
        if (!campaign.getOwnerUserId().equals(userId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        requireSessionInProgress(requireSession(campaignId, sessionId));
        return campaign;
    }

    private CampaignEntity requireMemberSession(Long userId, Long campaignId, Long sessionId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        if (!campaign.getOwnerUserId().equals(userId) && !campaignMemberRepository.existsById(new CampaignMemberId(campaignId, userId))) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        requireSession(campaignId, sessionId);
        return campaign;
    }

    private CampaignSessionEntity requireSession(Long campaignId, Long sessionId) {
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private RequestedRollEntity requireRequestedRoll(Long campaignId, Long sessionId, Long requestId) {
        RequestedRollEntity row = requestedRollRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Requested roll not found"));
        if (!Objects.equals(row.getCampaignId(), campaignId) || !Objects.equals(row.getSessionId(), sessionId)) {
            throw new ResourceNotFoundException("Requested roll not found");
        }
        return row;
    }

    private void requireSessionInProgress(CampaignSessionEntity session) {
        if (!"IN_PROGRESS".equals(session.getStatus())) {
            throw new IllegalArgumentException("Requested rolls are available only for IN_PROGRESS session.");
        }
    }

    private String normalizeTargetMode(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "CHARACTER", "USER", "ALL" -> normalized;
            default -> throw new IllegalArgumentException("targetMode must be CHARACTER, USER or ALL");
        };
    }

    private String normalizeRollType(String value) {
        if (value == null || value.isBlank()) {
            return "SKILL";
        }
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String chooseExpression(String systemCode, String payloadExpression, String requestedExpression) {
        String explicit = trimToNull(payloadExpression);
        if (explicit != null) return explicit;
        String saved = trimToNull(requestedExpression);
        if (saved != null) return saved;
        // TODO: Add system-specific requested-roll expressions (e.g. CoC percentile roller) in future stage.
        if ("dnd5e".equalsIgnoreCase(systemCode)) return "1d20";
        return "1d20";
    }

    private String requireText(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String displayNameFor(UserEntity user) {
        if (user == null) return "Nieznany uzytkownik";
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }
}

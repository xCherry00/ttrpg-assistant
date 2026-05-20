package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.SessionLiveStateResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionLiveStateRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class SessionLiveStateService {

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CombatEncounterRepository combatEncounterRepository;
    private final SessionLiveStateRepository sessionLiveStateRepository;

    @Transactional(readOnly = true)
    public SessionLiveStateResponse getState(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        return toResponse(sessionLiveStateRepository.findBySessionId(sessionId)
                .orElseGet(() -> SessionLiveStateEntity.builder()
                        .campaignId(campaignId)
                        .sessionId(sessionId)
                        .build()));
    }

    @Transactional
    public SessionLiveStateResponse updateState(Long userId, Long campaignId, Long sessionId, UpdateSessionLiveStateRequest request) {
        requireOwnerSession(userId, campaignId, sessionId);

        SessionLiveStateEntity state = sessionLiveStateRepository.findBySessionId(sessionId)
                .orElseGet(() -> SessionLiveStateEntity.builder()
                        .campaignId(campaignId)
                        .sessionId(sessionId)
                        .build());

        state.setSceneTitle(normalizeNullable(request.sceneTitle()));
        state.setSceneImageUrl(normalizeNullable(request.sceneImageUrl()));
        state.setSceneDescription(normalizeNullable(request.sceneDescription()));
        state.setActiveEncounterId(validateEncounter(campaignId, request.activeEncounterId()));
        state.setUpdatedByUserId(userId);

        return toResponse(sessionLiveStateRepository.save(state));
    }

    private Long validateEncounter(Long campaignId, Long encounterId) {
        if (encounterId == null) {
            return null;
        }
        combatEncounterRepository.findByIdAndCampaignIdAndDeletedAtIsNull(encounterId, campaignId)
                .orElseThrow(() -> new IllegalArgumentException("activeEncounterId must belong to campaign."));
        return encounterId;
    }

    private SessionLiveStateResponse toResponse(SessionLiveStateEntity state) {
        return new SessionLiveStateResponse(
                state.getCampaignId(),
                state.getSessionId(),
                safe(state.getSceneTitle()),
                safe(state.getSceneImageUrl()),
                safe(state.getSceneDescription()),
                state.getActiveEncounterId(),
                state.getUpdatedAt()
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

    private CampaignSessionEntity requireMemberSession(Long userId, Long campaignId, Long sessionId) {
        requireMemberAccess(userId, campaignId);
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private CampaignSessionEntity requireOwnerSession(Long userId, Long campaignId, Long sessionId) {
        CampaignEntity campaign = requireMemberAccess(userId, campaignId);
        if (!campaign.getOwnerUserId().equals(userId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}

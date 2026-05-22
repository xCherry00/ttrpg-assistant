package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.SessionPlayerNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpsertSessionPlayerNoteRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
public class SessionPlayerNoteService {
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final SessionPlayerNoteRepository sessionPlayerNoteRepository;

    @Transactional(readOnly = true)
    public SessionPlayerNoteResponse getMyNote(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        SessionPlayerNoteEntity note = sessionPlayerNoteRepository.findBySessionIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session player note not found"));
        return toResponse(note);
    }

    @Transactional
    public SessionPlayerNoteResponse upsertMyNote(Long userId, Long campaignId, Long sessionId, UpsertSessionPlayerNoteRequest request) {
        requireMemberSession(userId, campaignId, sessionId);
        String title = normalize(request.title());
        String content = normalize(request.content());
        if (title.isBlank() && content.isBlank()) {
            throw new IllegalArgumentException("Either title or content is required.");
        }

        SessionPlayerNoteEntity note = sessionPlayerNoteRepository.findBySessionIdAndUserId(sessionId, userId)
                .orElse(SessionPlayerNoteEntity.builder()
                        .campaignId(campaignId)
                        .sessionId(sessionId)
                        .userId(userId)
                        .build());
        note.setTitle(title);
        note.setContent(content);
        SessionPlayerNoteEntity saved = sessionPlayerNoteRepository.save(note);
        return toResponse(saved);
    }

    @Transactional
    public void deleteMyNote(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        SessionPlayerNoteEntity note = sessionPlayerNoteRepository.findBySessionIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session player note not found"));
        sessionPlayerNoteRepository.delete(note);
    }

    private CampaignSessionEntity requireMemberSession(Long userId, Long campaignId, Long sessionId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        if (!campaign.getOwnerUserId().equals(userId) && !campaignMemberRepository.existsById(memberId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private SessionPlayerNoteResponse toResponse(SessionPlayerNoteEntity note) {
        return new SessionPlayerNoteResponse(
                note.getId(),
                note.getCampaignId(),
                note.getSessionId(),
                note.getUserId(),
                note.getTitle() == null ? "" : note.getTitle(),
                note.getContent() == null ? "" : note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }
}

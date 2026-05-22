package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.DashboardSessionNoteBacklogItem;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final String SESSION_STATUS_FINISHED = "FINISHED";

    private final CampaignRepository campaignRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final SessionPlayerNoteRepository sessionPlayerNoteRepository;

    @Transactional(readOnly = true)
    public List<DashboardSessionNoteBacklogItem> sessionNoteBacklog(Long userId) {
        List<CampaignEntity> visibleCampaigns = campaignRepository.findVisibleForUser(userId);
        if (visibleCampaigns.isEmpty()) return List.of();

        Set<Long> campaignIds = visibleCampaigns.stream().map(CampaignEntity::getId).collect(Collectors.toSet());
        List<CampaignSessionEntity> finishedSessions = campaignSessionRepository
                .findByCampaignIdInAndStatusOrderByFinishedAtDescUpdatedAtDesc(campaignIds, SESSION_STATUS_FINISHED);
        if (finishedSessions.isEmpty()) return List.of();

        Set<Long> sessionIds = finishedSessions.stream().map(CampaignSessionEntity::getId).collect(Collectors.toSet());
        Set<Long> withNotes = sessionPlayerNoteRepository.findByUserIdAndSessionIdIn(userId, sessionIds).stream()
                .map(SessionPlayerNoteEntity::getSessionId)
                .collect(Collectors.toSet());
        return finishedSessions.stream()
                .filter(session -> !withNotes.contains(session.getId()))
                .limit(5)
                .map(session -> {
                    String campaignTitle = visibleCampaigns.stream()
                            .filter(c -> c.getId().equals(session.getCampaignId()))
                            .map(CampaignEntity::getTitle)
                            .findFirst()
                            .orElse("Kampania");
                    Instant statusUpdatedAt = session.getUpdatedAt();
                    return new DashboardSessionNoteBacklogItem(
                            session.getCampaignId(),
                            campaignTitle,
                            session.getId(),
                            session.getTitle(),
                            session.getScheduledFor(),
                            session.getFinishedAt(),
                            statusUpdatedAt,
                            SESSION_STATUS_FINISHED
                    );
                })
                .toList();
    }
}

package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.SessionAttendanceResponse;
import pl.ttrpgassistant.backend.campaign.dto.SessionAttendanceSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionAttendanceRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignSessionAttendanceService {
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CampaignSessionAttendanceRepository campaignSessionAttendanceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SessionAttendanceSummaryResponse getAttendance(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        List<CampaignSessionAttendanceEntity> rows = campaignSessionAttendanceRepository.findBySessionId(sessionId);
        return toSummary(userId, campaignId, sessionId, rows);
    }

    @Transactional
    public SessionAttendanceSummaryResponse upsertMyAttendance(Long userId, Long campaignId, Long sessionId, UpdateSessionAttendanceRequest request) {
        requireMemberSession(userId, campaignId, sessionId);
        CampaignSessionAttendanceEntity entity = campaignSessionAttendanceRepository.findBySessionIdAndUserId(sessionId, userId)
                .orElse(CampaignSessionAttendanceEntity.builder()
                        .campaignId(campaignId)
                        .sessionId(sessionId)
                        .userId(userId)
                        .build());
        entity.setStatus(normalizeAttendance(request.status()));
        entity.setNote(normalizeNote(request.note()));
        campaignSessionAttendanceRepository.save(entity);
        return getAttendance(userId, campaignId, sessionId);
    }

    private SessionAttendanceSummaryResponse toSummary(Long currentUserId, Long campaignId, Long sessionId, List<CampaignSessionAttendanceEntity> rows) {
        int availableCount = 0;
        int maybeCount = 0;
        int unavailableCount = 0;
        for (CampaignSessionAttendanceEntity item : rows) {
            switch (normalizeAttendance(item.getStatus())) {
                case "AVAILABLE" -> availableCount++;
                case "UNAVAILABLE" -> unavailableCount++;
                default -> maybeCount++;
            }
        }

        long memberCount = campaignMemberRepository.countByCampaignId(campaignId);
        int noResponseCount = (int) Math.max(0, memberCount - rows.size());
        Map<Long, UserEntity> usersById = userRepository.findAllById(rows.stream().map(CampaignSessionAttendanceEntity::getUserId).toList())
                .stream()
                .collect(Collectors.toMap(UserEntity::getId, Function.identity()));

        List<SessionAttendanceResponse> responses = rows.stream()
                .map(item -> toResponse(currentUserId, item, usersById.get(item.getUserId())))
                .sorted(Comparator.comparing(SessionAttendanceResponse::displayName, String.CASE_INSENSITIVE_ORDER))
                .toList();
        return new SessionAttendanceSummaryResponse(sessionId, availableCount, maybeCount, unavailableCount, noResponseCount, responses);
    }

    private SessionAttendanceResponse toResponse(Long currentUserId, CampaignSessionAttendanceEntity row, UserEntity user) {
        return new SessionAttendanceResponse(
                row.getId(),
                row.getCampaignId(),
                row.getSessionId(),
                row.getUserId(),
                user == null ? "" : user.getUsername(),
                displayNameFor(user),
                normalizeAttendance(row.getStatus()),
                row.getNote(),
                row.getUserId().equals(currentUserId),
                row.getUpdatedAt()
        );
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

    private String normalizeAttendance(String rawStatus) {
        String value = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "AVAILABLE", "MAYBE", "UNAVAILABLE" -> value;
            case "YES" -> "AVAILABLE";
            case "NO" -> "UNAVAILABLE";
            default -> throw new IllegalArgumentException("Attendance status must be AVAILABLE, MAYBE or UNAVAILABLE");
        };
    }

    private String normalizeNote(String note) {
        if (note == null) {
            return null;
        }
        String normalized = note.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private String displayNameFor(UserEntity user) {
        if (user == null) {
            return "Nieznany użytkownik";
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }
}

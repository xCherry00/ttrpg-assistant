package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMaterialResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignNotificationResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionAttendanceResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionMessageResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignMaterialRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionMessageRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionAttendanceRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpsertCampaignSessionNoteRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignWorkspaceService {

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final CampaignSessionRepository campaignSessionRepository;
    private final CampaignSessionAttendanceRepository campaignSessionAttendanceRepository;
    private final CampaignSessionMessageRepository campaignSessionMessageRepository;
    private final CampaignSessionNoteRepository campaignSessionNoteRepository;
    private final CampaignNotificationRepository campaignNotificationRepository;
    private final CampaignMaterialRepository campaignMaterialRepository;
    private final UserRepository userRepository;

    @Transactional
    public CampaignSummaryResponse updateCampaign(Long userId, Long campaignId, UpdateCampaignRequest request) {
        CampaignEntity campaign = requireOwnerAccess(userId, campaignId);
        campaign.setTitle(request.title().trim());
        campaign.setDescriptionMd(normalizeText(request.description()));
        campaign.setCoverImageUrl(normalizeNullable(request.coverImageUrl()));
        CampaignEntity saved = campaignRepository.save(campaign);

        notifyCampaignMembers(campaignId, userId, "CAMPAIGN_UPDATED", "Zaktualizowano podstawowe informacje o kampanii.", true);
        return new CampaignSummaryResponse(
                saved.getId(),
                saved.getTitle(),
                saved.getSystemCode(),
                saved.getDescriptionMd(),
                saved.getCoverImageUrl(),
                saved.getStatus(),
                saved.getJoinCode(),
                "/campaigns/join?code=" + saved.getJoinCode(),
                "GM",
                true,
                saved.getCreatedAt(),
                saved.getUpdatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<CampaignSessionSummaryResponse> listSessions(Long userId, Long campaignId) {
        requireMemberAccess(userId, campaignId);
        List<CampaignSessionEntity> sessions = campaignSessionRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId);
        Map<Long, List<CampaignSessionAttendanceEntity>> attendanceBySession = campaignSessionAttendanceRepository.findAll().stream()
                .filter(item -> sessions.stream().anyMatch(session -> session.getId().equals(item.getId().getSessionId())))
                .collect(Collectors.groupingBy(item -> item.getId().getSessionId()));
        Map<Long, Integer> messageCounts = campaignSessionMessageRepository.findAll().stream()
                .filter(item -> sessions.stream().anyMatch(session -> session.getId().equals(item.getSessionId())))
                .collect(Collectors.groupingBy(CampaignSessionMessageEntity::getSessionId, Collectors.summingInt(item -> 1)));

        return sessions.stream()
                .map(session -> toSessionSummary(userId, session, attendanceBySession.getOrDefault(session.getId(), List.of()), messageCounts.getOrDefault(session.getId(), 0)))
                .toList();
    }

    @Transactional
    public CampaignSessionSummaryResponse createSession(Long userId, Long campaignId, CreateCampaignSessionRequest request) {
        requireOwnerAccess(userId, campaignId);
        CampaignSessionEntity session = campaignSessionRepository.save(CampaignSessionEntity.builder()
                .campaignId(campaignId)
                .title(request.title().trim())
                .descriptionMd(normalizeText(request.description()))
                .status("PLANNED")
                .scheduledFor(parseInstant(request.scheduledFor()))
                .createdByUserId(userId)
                .build());

        seedAttendanceForCampaignMembers(campaignId, session.getId());
        notifyCampaignMembers(campaignId, userId, "SESSION_CREATED", "Dodano nowa sesje: " + session.getTitle(), false);
        return toSessionSummary(userId, session, campaignSessionAttendanceRepository.findByIdSessionId(session.getId()), 0);
    }

    @Transactional
    public CampaignSessionSummaryResponse startSession(Long userId, Long campaignId, Long sessionId) {
        CampaignSessionEntity session = requireOwnerSession(userId, campaignId, sessionId);
        if ("FINISHED".equals(session.getStatus())) {
            throw new IllegalArgumentException("Ta sesja jest juz zakonczona.");
        }
        session.setStatus("ACTIVE");
        session.setStartedAt(Instant.now());
        CampaignSessionEntity saved = campaignSessionRepository.save(session);
        notifyCampaignMembers(campaignId, userId, "SESSION_STARTED", "MG rozpoczal sesje: " + saved.getTitle(), true);
        return toSessionSummary(userId, saved, campaignSessionAttendanceRepository.findByIdSessionId(saved.getId()), countMessages(saved.getId()));
    }

    @Transactional
    public CampaignSessionSummaryResponse finishSession(Long userId, Long campaignId, Long sessionId) {
        CampaignSessionEntity session = requireOwnerSession(userId, campaignId, sessionId);
        session.setStatus("FINISHED");
        if (session.getStartedAt() == null) {
            session.setStartedAt(Instant.now());
        }
        session.setFinishedAt(Instant.now());
        CampaignSessionEntity saved = campaignSessionRepository.save(session);

        campaignSessionNoteRepository.findById(sessionId).orElseGet(() ->
                campaignSessionNoteRepository.save(CampaignSessionNoteEntity.builder()
                        .sessionId(sessionId)
                        .updatedByUserId(userId)
                        .build())
        );

        notifyCampaignMembers(campaignId, userId, "SESSION_FINISHED", "Zakonczono sesje: " + saved.getTitle(), true);
        return toSessionSummary(userId, saved, campaignSessionAttendanceRepository.findByIdSessionId(saved.getId()), countMessages(saved.getId()));
    }

    @Transactional(readOnly = true)
    public List<CampaignSessionAttendanceResponse> listAttendance(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        List<CampaignSessionAttendanceEntity> attendance = campaignSessionAttendanceRepository.findByIdSessionId(sessionId);
        Map<Long, UserEntity> usersById = userRepository.findAllById(
                attendance.stream().map(item -> item.getId().getUserId()).toList()
        ).stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));

        return attendance.stream()
                .map(item -> {
                    UserEntity user = usersById.get(item.getId().getUserId());
                    if (user == null) return null;
                    return new CampaignSessionAttendanceResponse(
                            user.getId(),
                            displayNameFor(user),
                            user.getUsername(),
                            user.getTagCode(),
                            item.getStatus(),
                            user.getId().equals(userId),
                            item.getUpdatedAt()
                    );
                })
                .filter(item -> item != null)
                .sorted(Comparator.comparing(CampaignSessionAttendanceResponse::displayName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public List<CampaignSessionAttendanceResponse> updateAttendance(Long userId, Long campaignId, Long sessionId, UpdateSessionAttendanceRequest request) {
        requireMemberSession(userId, campaignId, sessionId);
        String normalized = normalizeAttendance(request.status());
        CampaignSessionAttendanceId id = new CampaignSessionAttendanceId(sessionId, userId);
        CampaignSessionAttendanceEntity entity = campaignSessionAttendanceRepository.findById(id)
                .orElse(CampaignSessionAttendanceEntity.builder().id(id).build());
        entity.setStatus(normalized);
        campaignSessionAttendanceRepository.save(entity);
        return listAttendance(userId, campaignId, sessionId);
    }

    @Transactional(readOnly = true)
    public List<CampaignSessionMessageResponse> listMessages(Long userId, Long campaignId, Long sessionId) {
        requireMemberSession(userId, campaignId, sessionId);
        List<CampaignSessionMessageEntity> messages = campaignSessionMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
        Map<Long, UserEntity> usersById = userRepository.findAllById(messages.stream().map(CampaignSessionMessageEntity::getAuthorUserId).collect(Collectors.toSet()))
                .stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));

        return messages.stream()
                .map(message -> toMessageResponse(userId, message, usersById.get(message.getAuthorUserId())))
                .toList();
    }

    @Transactional
    public CampaignSessionMessageResponse addMessage(Long userId, Long campaignId, Long sessionId, CreateCampaignSessionMessageRequest request) {
        CampaignSessionEntity session = requireMemberSession(userId, campaignId, sessionId);
        if (!"ACTIVE".equals(session.getStatus())) {
            throw new IllegalArgumentException("Chat jest aktywny tylko w trakcie trwajacej sesji.");
        }

        CampaignSessionMessageEntity saved = campaignSessionMessageRepository.save(CampaignSessionMessageEntity.builder()
                .sessionId(sessionId)
                .authorUserId(userId)
                .content(request.content().trim())
                .build());
        return toMessageResponse(userId, saved, getUser(userId));
    }

    @Transactional(readOnly = true)
    public CampaignSessionNoteResponse getNote(Long userId, Long campaignId, Long sessionId) {
        CampaignSessionEntity session = requireMemberSession(userId, campaignId, sessionId);
        CampaignSessionNoteEntity note = campaignSessionNoteRepository.findById(sessionId)
                .orElse(CampaignSessionNoteEntity.builder().sessionId(sessionId).build());
        return toNoteResponse(session, note);
    }

    @Transactional
    public CampaignSessionNoteResponse upsertNote(Long userId, Long campaignId, Long sessionId, UpsertCampaignSessionNoteRequest request) {
        CampaignSessionEntity session = requireOwnerSession(userId, campaignId, sessionId);
        CampaignSessionNoteEntity note = campaignSessionNoteRepository.findById(sessionId)
                .orElse(CampaignSessionNoteEntity.builder().sessionId(sessionId).build());

        note.setSummary(normalizeText(request.summary()));
        note.setImportantEvents(normalizeText(request.importantEvents()));
        note.setLoot(normalizeText(request.loot()));
        note.setNpcRefs(normalizeText(request.npcRefs()));
        note.setDecisions(normalizeText(request.decisions()));
        note.setNextHooks(normalizeText(request.nextHooks()));
        note.setUpdatedByUserId(userId);
        CampaignSessionNoteEntity saved = campaignSessionNoteRepository.save(note);

        String title = session.getTitle();
        String message = session.getFinishedAt() == null
                ? "MG zaktualizowal notatke do sesji: " + title
                : "MG zaktualizowal zakonczona notatke sesji: " + title;
        notifyCampaignMembers(campaignId, userId, "SESSION_NOTE_UPDATED", message, true);

        return toNoteResponse(session, saved);
    }

    @Transactional(readOnly = true)
    public List<CampaignNotificationResponse> listNotifications(Long userId, Long campaignId) {
        requireMemberAccess(userId, campaignId);
        return campaignNotificationRepository.findTop20ByUserIdAndCampaignIdOrderByCreatedAtDesc(userId, campaignId).stream()
                .map(notification -> new CampaignNotificationResponse(
                        notification.getId(),
                        notification.getType(),
                        notification.getMessage(),
                        notification.getReadAt() != null,
                        notification.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public CampaignNotificationResponse markNotificationRead(Long userId, Long campaignId, Long notificationId) {
        requireMemberAccess(userId, campaignId);
        CampaignNotificationEntity notification = campaignNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId) || !notification.getCampaignId().equals(campaignId)) {
            throw new ResourceNotFoundException("Notification not found");
        }
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            campaignNotificationRepository.save(notification);
        }
        return new CampaignNotificationResponse(notification.getId(), notification.getType(), notification.getMessage(), true, notification.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<CampaignMaterialResponse> listMaterials(Long userId, Long campaignId) {
        requireMemberAccess(userId, campaignId);
        Map<Long, UserEntity> usersById = userRepository.findAllById(
                campaignMaterialRepository.findByCampaignIdOrderByUpdatedAtDescCreatedAtDesc(campaignId).stream()
                        .map(CampaignMaterialEntity::getCreatedByUserId)
                        .collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(UserEntity::getId, Function.identity()));

        return campaignMaterialRepository.findByCampaignIdOrderByUpdatedAtDescCreatedAtDesc(campaignId).stream()
                .map(material -> new CampaignMaterialResponse(
                        material.getId(),
                        material.getType(),
                        material.getTitle(),
                        material.getContent(),
                        displayNameFor(usersById.get(material.getCreatedByUserId())),
                        material.getCreatedAt(),
                        material.getUpdatedAt()
                ))
                .toList();
    }

    @Transactional
    public CampaignMaterialResponse createMaterial(Long userId, Long campaignId, CreateCampaignMaterialRequest request) {
        requireOwnerAccess(userId, campaignId);
        CampaignMaterialEntity material = campaignMaterialRepository.save(CampaignMaterialEntity.builder()
                .campaignId(campaignId)
                .type(request.type().trim().toUpperCase(Locale.ROOT))
                .title(request.title().trim())
                .content(normalizeText(request.content()))
                .createdByUserId(userId)
                .build());
        notifyCampaignMembers(campaignId, userId, "MATERIAL_CREATED", "Dodano nowy material kampanii: " + material.getTitle(), false);
        return new CampaignMaterialResponse(
                material.getId(),
                material.getType(),
                material.getTitle(),
                material.getContent(),
                displayNameFor(getUser(userId)),
                material.getCreatedAt(),
                material.getUpdatedAt()
        );
    }

    @Transactional
    public void notifyCampaignMembers(Long campaignId, Long actorUserId, String type, String message, boolean includeActor) {
        Set<Long> recipients = new LinkedHashSet<>(
                campaignMemberRepository.findByIdCampaignId(campaignId).stream()
                        .map(member -> member.getId().getUserId())
                        .toList()
        );
        if (!includeActor) {
            recipients.remove(actorUserId);
        }
        List<CampaignNotificationEntity> notifications = new ArrayList<>();
        Instant now = Instant.now();
        for (Long recipientId : recipients) {
            notifications.add(CampaignNotificationEntity.builder()
                    .campaignId(campaignId)
                    .userId(recipientId)
                    .type(type)
                    .message(message)
                    .createdAt(now)
                    .build());
        }
        if (!notifications.isEmpty()) {
            campaignNotificationRepository.saveAll(notifications);
        }
    }

    private void seedAttendanceForCampaignMembers(Long campaignId, Long sessionId) {
        List<CampaignSessionAttendanceEntity> rows = campaignMemberRepository.findByIdCampaignId(campaignId).stream()
                .map(member -> CampaignSessionAttendanceEntity.builder()
                        .id(new CampaignSessionAttendanceId(sessionId, member.getId().getUserId()))
                        .status("MAYBE")
                        .build())
                .toList();
        campaignSessionAttendanceRepository.saveAll(rows);
    }

    private CampaignSessionSummaryResponse toSessionSummary(
            Long currentUserId,
            CampaignSessionEntity session,
            List<CampaignSessionAttendanceEntity> attendance,
            int messageCount
    ) {
        int yesCount = 0;
        int maybeCount = 0;
        int noCount = 0;
        String myAttendance = "MAYBE";
        for (CampaignSessionAttendanceEntity item : attendance) {
            String status = normalizeAttendance(item.getStatus());
            switch (status) {
                case "YES" -> yesCount++;
                case "NO" -> noCount++;
                default -> maybeCount++;
            }
            if (item.getId().getUserId().equals(currentUserId)) {
                myAttendance = status;
            }
        }

        return new CampaignSessionSummaryResponse(
                session.getId(),
                session.getTitle(),
                session.getDescriptionMd(),
                session.getStatus(),
                session.getScheduledFor(),
                session.getStartedAt(),
                session.getFinishedAt(),
                myAttendance,
                yesCount,
                maybeCount,
                noCount,
                messageCount,
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }

    private CampaignSessionMessageResponse toMessageResponse(Long currentUserId, CampaignSessionMessageEntity message, UserEntity author) {
        return new CampaignSessionMessageResponse(
                message.getId(),
                message.getAuthorUserId(),
                displayNameFor(author),
                author == null ? "" : author.getUsername() + "-" + String.format("%04d", author.getTagCode()),
                author == null ? "" : author.getChatNickColor(),
                message.getAuthorUserId().equals(currentUserId),
                message.getContent(),
                message.getCreatedAt()
        );
    }

    private CampaignSessionNoteResponse toNoteResponse(CampaignSessionEntity session, CampaignSessionNoteEntity note) {
        UserEntity updatedBy = note.getUpdatedByUserId() == null ? null : userRepository.findById(note.getUpdatedByUserId()).orElse(null);
        boolean updatedAfterFinish = session.getFinishedAt() != null
                && note.getUpdatedAt() != null
                && note.getUpdatedAt().isAfter(session.getFinishedAt());
        return new CampaignSessionNoteResponse(
                session.getId(),
                safeText(note.getSummary()),
                safeText(note.getImportantEvents()),
                safeText(note.getLoot()),
                safeText(note.getNpcRefs()),
                safeText(note.getDecisions()),
                safeText(note.getNextHooks()),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                displayNameFor(updatedBy),
                updatedAfterFinish
        );
    }

    private CampaignEntity requireMemberAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        if (!campaign.getOwnerUserId().equals(userId) && !campaignMemberRepository.existsById(memberId)) {
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

    private CampaignSessionEntity requireMemberSession(Long userId, Long campaignId, Long sessionId) {
        requireMemberAccess(userId, campaignId);
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private CampaignSessionEntity requireOwnerSession(Long userId, Long campaignId, Long sessionId) {
        requireOwnerAccess(userId, campaignId);
        return campaignSessionRepository.findByIdAndCampaignId(sessionId, campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
    }

    private String normalizeAttendance(String rawStatus) {
        String value = rawStatus == null ? "" : rawStatus.trim().toUpperCase(Locale.ROOT);
        return switch (value) {
            case "YES", "NO", "MAYBE" -> value;
            default -> throw new IllegalArgumentException("Attendance status must be YES, NO or MAYBE");
        };
    }

    private Instant parseInstant(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(rawValue.trim());
        } catch (DateTimeParseException ignored) {
        }
        try {
            return LocalDateTime.parse(rawValue.trim()).toInstant(ZoneOffset.UTC);
        } catch (DateTimeParseException ex) {
            throw new IllegalArgumentException("Invalid session date format");
        }
    }

    private int countMessages(Long sessionId) {
        return campaignSessionMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).size();
    }

    private UserEntity getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String displayNameFor(UserEntity user) {
        if (user == null) {
            return "Nieznany uzytkownik";
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeNullable(String value) {
        String normalized = normalizeText(value);
        return normalized.isBlank() ? null : normalized;
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }
}

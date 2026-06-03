package pl.ttrpgassistant.backend.messages;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.messages.dto.MessageAttachmentResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageConversationSummaryResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageUnreadCountResponse;
import pl.ttrpgassistant.backend.messages.dto.MessageUserPreviewResponse;
import pl.ttrpgassistant.backend.social.FriendshipRepository;
import pl.ttrpgassistant.backend.social.UserBlockRepository;
import pl.ttrpgassistant.backend.user.ProfileVisibility;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private static final int MAX_FETCH_MESSAGES = 80;
    private static final int DEFAULT_FETCH_MESSAGES = 40;
    private static final int MAX_ATTACHMENT_FILES = 6;
    private static final long MAX_ATTACHMENT_SIZE_BYTES = 10L * 1024L * 1024L;
    private static final Set<String> ALLOWED_ATTACHMENT_MIME_TYPES = Set.of(
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "application/pdf",
            "text/plain",
            "application/zip",
            "application/x-zip-compressed",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final Set<String> ALLOWED_ATTACHMENT_EXTENSIONS = Set.of(
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".gif",
            ".pdf",
            ".txt",
            ".zip",
            ".doc",
            ".docx"
    );

    private final MessageConversationRepository conversationRepository;
    private final MessageConversationMemberRepository memberRepository;
    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final UserBlockRepository userBlockRepository;
    private final FriendshipRepository friendshipRepository;

    @Value("${app.messaging.uploadDir:uploads/messages}")
    private String uploadDir;

    @Transactional(readOnly = true)
    public List<MessageConversationSummaryResponse> listConversations(Long userId, String filter) {
        String normalizedFilter = filter == null ? "all" : filter.trim().toLowerCase(Locale.ROOT);
        Collection<MessageMemberStatus> statuses = switch (normalizedFilter) {
            case "requests" -> List.of(MessageMemberStatus.REQUESTED);
            case "all", "unread" -> List.of(MessageMemberStatus.ACTIVE, MessageMemberStatus.REQUESTED);
            default -> throw new IllegalArgumentException("Unsupported filter. Use all, unread or requests");
        };

        List<MessageConversationMemberEntity> memberships = memberRepository.findForUserByStatuses(userId, statuses);
        if (memberships.isEmpty()) {
            return List.of();
        }

        List<Long> conversationIds = memberships.stream().map(m -> m.getId().getConversationId()).toList();
        Map<Long, MessageConversationEntity> conversationsById = conversationRepository.findAllById(conversationIds).stream()
                .collect(Collectors.toMap(MessageConversationEntity::getId, entity -> entity));

        Map<Long, List<MessageConversationMemberEntity>> membersByConversation = memberRepository.findByConversationIds(conversationIds).stream()
                .collect(Collectors.groupingBy(entity -> entity.getId().getConversationId()));

        Set<Long> peerIds = membersByConversation.values().stream()
                .flatMap(List::stream)
                .map(m -> m.getId().getUserId())
                .filter(id -> !id.equals(userId))
                .collect(Collectors.toSet());
        Map<Long, UserEntity> usersById = userRepository.findAllById(peerIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, user -> user));

        List<MessageConversationSummaryResponse> summaries = new ArrayList<>();
        for (MessageConversationMemberEntity membership : memberships) {
            MessageConversationEntity conversation = conversationsById.get(membership.getId().getConversationId());
            if (conversation == null) {
                continue;
            }
            MessageConversationSummaryResponse summary = toConversationSummary(userId, conversation, membership, membersByConversation.getOrDefault(conversation.getId(), List.of()), usersById);
            if ("unread".equals(normalizedFilter) && summary.unreadCount() <= 0) {
                continue;
            }
            summaries.add(summary);
        }

        return summaries;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> listMessages(Long userId, Long conversationId, Long beforeId, Integer limitInput) {
        MessageConversationMemberEntity membership = requireMember(conversationId, userId);
        requireReadableMembership(membership);

        int limit = limitInput == null ? DEFAULT_FETCH_MESSAGES : Math.min(Math.max(1, limitInput), MAX_FETCH_MESSAGES);
        List<MessageEntity> messages = beforeId == null
                ? messageRepository.findByConversationIdOrderByIdDesc(conversationId, PageRequest.of(0, limit))
                : messageRepository.findByConversationIdAndIdLessThanOrderByIdDesc(conversationId, beforeId, PageRequest.of(0, limit));

        if (messages.isEmpty()) {
            return List.of();
        }

        messages.sort(Comparator.comparingLong(MessageEntity::getId));

        Set<Long> senderIds = messages.stream().map(MessageEntity::getSenderUserId).collect(Collectors.toSet());
        Map<Long, UserEntity> usersById = userRepository.findAllById(senderIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, user -> user));

        Map<Long, List<MessageAttachmentEntity>> attachmentsByMessage = attachmentRepository.findByMessageIds(
                messages.stream().map(MessageEntity::getId).toList()
        ).stream().collect(Collectors.groupingBy(MessageAttachmentEntity::getMessageId, LinkedHashMap::new, Collectors.toList()));

        return messages.stream()
                .map(message -> toMessageResponse(userId, message, usersById.get(message.getSenderUserId()), attachmentsByMessage.getOrDefault(message.getId(), List.of())))
                .toList();
    }

    @Transactional
    public MessageConversationSummaryResponse startOrGetDirectConversation(Long userId, Long targetUserId) {
        validateDirectParticipants(userId, targetUserId);
        UserEntity targetUser = getUser(targetUserId);
        getUser(userId);

        String directKey = directKey(userId, targetUserId);
        MessageConversationEntity conversation = conversationRepository.findByDirectKey(directKey).orElse(null);
        if (conversation == null) {
            conversation = conversationRepository.save(MessageConversationEntity.builder()
                    .type(MessageConversationType.DIRECT)
                    .directKey(directKey)
                    .createdByUserId(userId)
                    .build());

            boolean friends = friendshipRepository.existsByIdUserIdAndIdFriendUserId(userId, targetUserId)
                    && friendshipRepository.existsByIdUserIdAndIdFriendUserId(targetUserId, userId);

            MessageMemberStatus receiverStatus = friends ? MessageMemberStatus.ACTIVE : MessageMemberStatus.REQUESTED;

            memberRepository.save(MessageConversationMemberEntity.builder()
                    .id(new MessageConversationMemberId(conversation.getId(), userId))
                    .status(MessageMemberStatus.ACTIVE)
                    .build());
            memberRepository.save(MessageConversationMemberEntity.builder()
                    .id(new MessageConversationMemberId(conversation.getId(), targetUserId))
                    .status(receiverStatus)
                    .build());
        } else {
            MessageConversationMemberEntity targetMember = memberRepository.findByIdConversationIdAndIdUserId(conversation.getId(), targetUserId)
                    .orElseThrow(() -> new IllegalStateException("Conversation member is missing"));
            if (targetMember.getStatus() == MessageMemberStatus.REJECTED) {
                targetMember.setStatus(MessageMemberStatus.REQUESTED);
                memberRepository.save(targetMember);
            }
        }

        MessageConversationMemberEntity currentMember = requireMember(conversation.getId(), userId);
        List<MessageConversationMemberEntity> members = memberRepository.findByIdConversationId(conversation.getId());
        Map<Long, UserEntity> usersById = new HashMap<>();
        usersById.put(targetUserId, targetUser);
        return toConversationSummary(userId, conversation, currentMember, members, usersById);
    }

    @Transactional
    public MessageResponse sendMessage(Long userId, Long conversationId, String content, List<MultipartFile> files) {
        MessageConversationMemberEntity senderMembership = requireMember(conversationId, userId);
        if (senderMembership.getStatus() == MessageMemberStatus.REJECTED) {
            throw new IllegalArgumentException("You cannot send a message to this conversation");
        }

        MessageConversationEntity conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
        List<MessageConversationMemberEntity> members = memberRepository.findByIdConversationId(conversationId);
        if (members.stream().noneMatch(m -> m.getId().getUserId().equals(userId))) {
            throw new ResourceNotFoundException("Conversation not found");
        }

        String normalizedContent = normalizeContent(content);
        List<MultipartFile> safeFiles = files == null ? List.of() : files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
        if (normalizedContent.isBlank() && safeFiles.isEmpty()) {
            throw new IllegalArgumentException("Message must include text or at least one file");
        }
        if (safeFiles.size() > MAX_ATTACHMENT_FILES) {
            throw new IllegalArgumentException("You can attach at most " + MAX_ATTACHMENT_FILES + " files");
        }

        MessageEntity message = messageRepository.save(MessageEntity.builder()
                .conversationId(conversationId)
                .senderUserId(userId)
                .content(normalizedContent)
                .attachmentCount(safeFiles.size())
                .build());

        List<MessageAttachmentEntity> attachments = saveAttachments(userId, message.getId(), safeFiles);

        conversation.setLastMessageSenderUserId(userId);
        conversation.setLastMessageAt(message.getCreatedAt());
        conversation.setLastMessagePreview(buildPreview(normalizedContent, attachments.size()));
        conversationRepository.save(conversation);

        senderMembership.setLastReadMessageId(message.getId());
        senderMembership.setLastReadAt(Instant.now());
        memberRepository.save(senderMembership);

        UserEntity sender = getUser(userId);
        return toMessageResponse(userId, message, sender, attachments);
    }

    @Transactional
    public void markConversationRead(Long userId, Long conversationId) {
        MessageConversationMemberEntity membership = requireMember(conversationId, userId);
        requireReadableMembership(membership);

        MessageEntity latest = messageRepository.findTopByConversationIdOrderByIdDesc(conversationId).orElse(null);
        if (latest == null) {
            return;
        }
        membership.setLastReadMessageId(latest.getId());
        membership.setLastReadAt(Instant.now());
        memberRepository.save(membership);
    }

    @Transactional(readOnly = true)
    public MessageUnreadCountResponse getUnreadCount(Long userId) {
        long total = 0L;
        List<MessageConversationMemberEntity> memberships = memberRepository.findForUserByStatuses(userId, List.of(MessageMemberStatus.ACTIVE, MessageMemberStatus.REQUESTED));
        for (MessageConversationMemberEntity membership : memberships) {
            if (membership.getLastReadMessageId() == null) {
                total += messageRepository.countByConversationIdAndSenderUserIdNot(membership.getId().getConversationId(), userId);
            } else {
                total += messageRepository.countByConversationIdAndIdGreaterThanAndSenderUserIdNot(
                        membership.getId().getConversationId(),
                        membership.getLastReadMessageId(),
                        userId
                );
            }
        }
        return new MessageUnreadCountResponse(total);
    }

    @Transactional
    public void acceptConversationRequest(Long userId, Long conversationId) {
        MessageConversationMemberEntity membership = requireMember(conversationId, userId);
        if (membership.getStatus() != MessageMemberStatus.REQUESTED) {
            throw new IllegalArgumentException("Conversation request is already resolved");
        }
        membership.setStatus(MessageMemberStatus.ACTIVE);
        memberRepository.save(membership);
    }

    @Transactional
    public void rejectConversationRequest(Long userId, Long conversationId) {
        MessageConversationMemberEntity membership = requireMember(conversationId, userId);
        if (membership.getStatus() != MessageMemberStatus.REQUESTED) {
            throw new IllegalArgumentException("Conversation request is already resolved");
        }
        membership.setStatus(MessageMemberStatus.REJECTED);
        memberRepository.save(membership);
    }

    @Transactional(readOnly = true)
    public Resource downloadAttachment(Long userId, Long attachmentId) {
        MessageAttachmentEntity attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
        MessageEntity message = messageRepository.findById(attachment.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        MessageConversationMemberEntity membership = requireMember(message.getConversationId(), userId);
        requireReadableMembership(membership);

        Path path = Paths.get(attachment.getStoragePath());
        if (!Files.exists(path)) {
            throw new ResourceNotFoundException("Attachment file not found");
        }
        return new FileSystemResource(path);
    }

    @Transactional(readOnly = true)
    public MessageAttachmentEntity getAttachmentEntity(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
    }

    private MessageConversationSummaryResponse toConversationSummary(
            Long currentUserId,
            MessageConversationEntity conversation,
            MessageConversationMemberEntity currentMember,
            List<MessageConversationMemberEntity> allMembers,
            Map<Long, UserEntity> usersById
    ) {
        long unreadCount = currentMember.getLastReadMessageId() == null
                ? messageRepository.countByConversationIdAndSenderUserIdNot(conversation.getId(), currentUserId)
                : messageRepository.countByConversationIdAndIdGreaterThanAndSenderUserIdNot(conversation.getId(), currentMember.getLastReadMessageId(), currentUserId);

        MessageUserPreviewResponse peer = null;
        String title = conversation.getTitle();
        if (conversation.getType() == MessageConversationType.DIRECT) {
            Long peerUserId = allMembers.stream()
                    .map(member -> member.getId().getUserId())
                    .filter(id -> !id.equals(currentUserId))
                    .findFirst()
                    .orElse(null);
            if (peerUserId != null) {
                UserEntity peerUser = usersById.get(peerUserId);
                if (peerUser == null) {
                    peerUser = getUser(peerUserId);
                }
                peer = toUserPreview(peerUser);
                title = displayNameFor(peerUser);
            }
        }

        String status = "active";
        if (currentMember.getStatus() == MessageMemberStatus.REQUESTED) {
            status = "incoming_request";
        } else if (currentMember.getStatus() == MessageMemberStatus.ACTIVE) {
            boolean someoneRequested = allMembers.stream()
                    .anyMatch(member -> !member.getId().getUserId().equals(currentUserId) && member.getStatus() == MessageMemberStatus.REQUESTED);
            if (someoneRequested) {
                status = "outgoing_request";
            }
        }

        return new MessageConversationSummaryResponse(
                conversation.getId(),
                conversation.getType().name(),
                status,
                peer,
                title == null ? "" : title,
                conversation.getLastMessagePreview(),
                conversation.getLastMessageSenderUserId(),
                conversation.getLastMessageAt(),
                unreadCount
        );
    }

    private MessageResponse toMessageResponse(Long currentUserId, MessageEntity message, UserEntity sender, List<MessageAttachmentEntity> attachments) {
        String senderDisplay = sender == null ? "Użytkownik" : displayNameFor(sender);
        String handle = sender == null ? "" : handleFor(sender);
        return new MessageResponse(
                message.getId(),
                message.getConversationId(),
                message.getSenderUserId(),
                senderDisplay,
                handle,
                message.getSenderUserId().equals(currentUserId),
                message.getContent(),
                message.getCreatedAt(),
                attachments.stream().map(this::toAttachmentResponse).toList()
        );
    }

    private MessageAttachmentResponse toAttachmentResponse(MessageAttachmentEntity attachment) {
        return new MessageAttachmentResponse(
                attachment.getId(),
                attachment.getOriginalName(),
                attachment.getMimeType(),
                attachment.getSizeBytes(),
                "/api/messages/attachments/" + attachment.getId()
        );
    }

    private List<MessageAttachmentEntity> saveAttachments(Long uploaderUserId, Long messageId, List<MultipartFile> files) {
        if (files.isEmpty()) {
            return List.of();
        }

        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Could not prepare upload directory", e);
        }

        List<MessageAttachmentEntity> saved = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
                throw new IllegalArgumentException("File " + file.getOriginalFilename() + " exceeds 10 MB");
            }
            String original = sanitizeFilename(file.getOriginalFilename());
            String extension = getFileExtension(original);
            String mimeType = normalizeMimeType(file.getContentType());
            if (!isAllowedAttachmentType(mimeType, extension)) {
                throw new IllegalArgumentException(
                        "Unsupported file type for " + original + ". Allowed: png, jpg, jpeg, webp, gif, pdf, txt, zip, doc, docx"
                );
            }

            String storedName = UUID.randomUUID() + extension;
            Path target = root.resolve(storedName);
            try {
                Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new IllegalStateException("Could not store attachment " + original, e);
            }

            MessageAttachmentEntity entity = attachmentRepository.save(MessageAttachmentEntity.builder()
                    .messageId(messageId)
                    .uploaderUserId(uploaderUserId)
                    .storagePath(target.toString())
                    .originalName(original)
                    .mimeType(mimeType)
                    .sizeBytes(file.getSize())
                    .build());
            saved.add(entity);
        }
        return saved;
    }

    private void validateDirectParticipants(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot create a conversation with yourself");
        }
        getUser(targetUserId);
        if (isBlockedEitherWay(userId, targetUserId)) {
            throw new IllegalArgumentException("This user is unavailable for interactions");
        }
    }

    private boolean isBlockedEitherWay(Long leftUserId, Long rightUserId) {
        return userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(leftUserId, rightUserId)
                || userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(rightUserId, leftUserId);
    }

    private MessageConversationMemberEntity requireMember(Long conversationId, Long userId) {
        return memberRepository.findByIdConversationIdAndIdUserId(conversationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found"));
    }

    private void requireReadableMembership(MessageConversationMemberEntity membership) {
        if (membership.getStatus() == MessageMemberStatus.REJECTED) {
            throw new ResourceNotFoundException("Conversation not found");
        }
    }

    private UserEntity getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String directKey(Long leftUserId, Long rightUserId) {
        long min = Math.min(leftUserId, rightUserId);
        long max = Math.max(leftUserId, rightUserId);
        return min + ":" + max;
    }

    private String normalizeContent(String content) {
        return content == null ? "" : content.trim();
    }

    private String buildPreview(String content, int attachmentCount) {
        if (!content.isBlank()) {
            return content.length() > 260 ? content.substring(0, 260) + "..." : content;
        }
        if (attachmentCount <= 0) {
            return "";
        }
        return attachmentCount == 1 ? "Wysłano załącznik" : "Wysłano załączniki (" + attachmentCount + ")";
    }

    private String sanitizeFilename(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            return "attachment";
        }
        return originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot >= filename.length() - 1) {
            return "";
        }
        return filename.substring(dot).toLowerCase(Locale.ROOT);
    }

    private String normalizeMimeType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private boolean isAllowedAttachmentType(String mimeType, String extension) {
        if (ALLOWED_ATTACHMENT_MIME_TYPES.contains(mimeType)) {
            return true;
        }

        if ("application/octet-stream".equals(mimeType) && ALLOWED_ATTACHMENT_EXTENSIONS.contains(extension)) {
            return true;
        }

        return false;
    }

    private MessageUserPreviewResponse toUserPreview(UserEntity user) {
        return new MessageUserPreviewResponse(
                user.getId(),
                handleFor(user),
                user.getUsername(),
                user.getTagCode(),
                displayNameFor(user),
                user.getAvatarUrl(),
                user.getProfileBannerUrl(),
                formatActivityLabel(user)
        );
    }

    private String displayNameFor(UserEntity user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }

    private String handleFor(UserEntity user) {
        return user.getUsername() + "-" + String.format("%04d", user.getTagCode());
    }

    private String formatActivityLabel(UserEntity user) {
        Instant lastActiveAt = user.getLastActiveAt();
        if (lastActiveAt == null || user.getActivityVisibility() == ProfileVisibility.PRIVATE) {
            return "aktywność ukryta";
        }

        Duration duration = Duration.between(lastActiveAt, Instant.now());
        if (duration.toHours() < 24) {
            return "aktywny dzisiaj";
        }
        if (duration.toDays() < 7) {
            return "aktywny w tym tygodniu";
        }
        if (duration.toDays() < 30) {
            return "aktywny w tym miesiącu";
        }
        return "dawno nieaktywny";
    }
}

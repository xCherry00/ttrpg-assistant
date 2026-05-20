package pl.ttrpgassistant.backend.notifications;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.campaign.CampaignNotificationEntity;
import pl.ttrpgassistant.backend.campaign.CampaignNotificationRepository;
import pl.ttrpgassistant.backend.messages.MessageService;
import pl.ttrpgassistant.backend.messages.dto.MessageConversationSummaryResponse;
import pl.ttrpgassistant.backend.notifications.dto.NotificationItemResponse;
import pl.ttrpgassistant.backend.notifications.dto.NotificationOverviewResponse;
import pl.ttrpgassistant.backend.common.pagination.PagedResponse;
import pl.ttrpgassistant.backend.social.FriendRequestEntity;
import pl.ttrpgassistant.backend.social.FriendRequestRepository;
import pl.ttrpgassistant.backend.social.FriendRequestStatus;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final int MAX_ITEMS = 30;

    private final CampaignNotificationRepository campaignNotificationRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;

    @Transactional(readOnly = true)
    public NotificationOverviewResponse overview(Long userId, Integer page, Integer size) {
        List<NotificationItemResponse> items = new ArrayList<>();

        List<CampaignNotificationEntity> campaignNotifications = campaignNotificationRepository
                .findTop20ByUserIdOrderByCreatedAtDesc(userId);
        campaignNotifications.stream()
                .map(this::campaignItem)
                .forEach(items::add);

        List<FriendRequestEntity> friendRequests = friendRequestRepository
                .findByReceiverUserIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING);
        Map<Long, UserEntity> sendersById = loadUsers(friendRequests.stream()
                .map(FriendRequestEntity::getSenderUserId)
                .collect(Collectors.toSet()));
        friendRequests.stream()
                .limit(10)
                .map(request -> friendRequestItem(request, sendersById.get(request.getSenderUserId())))
                .forEach(items::add);

        List<MessageConversationSummaryResponse> unreadConversations = messageService.listConversations(userId, "unread");
        unreadConversations.stream()
                .limit(10)
                .map(this::messageItem)
                .forEach(items::add);

        items.sort(Comparator.comparing(NotificationItemResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        if (items.size() > MAX_ITEMS) {
            items = new ArrayList<>(items.subList(0, MAX_ITEMS));
        }
        items = PagedResponse.of(items, page, size == null ? MAX_ITEMS : size).items();

        long unreadCampaigns = campaignNotificationRepository.countByUserIdAndReadAtIsNull(userId);
        long unreadMessages = unreadConversations.stream().mapToLong(MessageConversationSummaryResponse::unreadCount).sum();
        long unreadCount = unreadCampaigns + friendRequests.size() + unreadMessages;

        return new NotificationOverviewResponse(unreadCount, items);
    }

    @Transactional
    public NotificationOverviewResponse markRead(Long userId, Long notificationId) {
        CampaignNotificationEntity notification = campaignNotificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
            campaignNotificationRepository.save(notification);
        }
        return overview(userId, null, null);
    }

    @Transactional
    public NotificationOverviewResponse markAllRead(Long userId) {
        List<CampaignNotificationEntity> unread = campaignNotificationRepository.findByUserIdAndReadAtIsNull(userId);
        if (!unread.isEmpty()) {
            Instant now = Instant.now();
            unread.forEach(item -> item.setReadAt(now));
            campaignNotificationRepository.saveAll(unread);
        }
        return overview(userId, null, null);
    }

    @Transactional
    public NotificationOverviewResponse deleteOne(Long userId, Long notificationId) {
        campaignNotificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));
        campaignNotificationRepository.deleteByIdAndUserId(notificationId, userId);
        return overview(userId, null, null);
    }

    @Transactional
    public NotificationOverviewResponse clearAll(Long userId) {
        campaignNotificationRepository.deleteByUserId(userId);
        return overview(userId, null, null);
    }

    private NotificationItemResponse campaignItem(CampaignNotificationEntity notification) {
        String type = normalizeType(notification.getType());
        return new NotificationItemResponse(
                "campaign-" + notification.getId(),
                "campaign",
                type,
                campaignTitle(type),
                notification.getMessage(),
                notification.getReadAt() != null,
                notification.getCreatedAt(),
                "/campaigns/" + notification.getCampaignId()
        );
    }

    private NotificationItemResponse friendRequestItem(FriendRequestEntity request, UserEntity sender) {
        String displayName = displayNameFor(sender);
        return new NotificationItemResponse(
                "friend-request-" + request.getId(),
                "social",
                "friend_request",
                "Zaproszenie do znajomych",
                displayName + " chce dodać Cię do znajomych.",
                false,
                request.getCreatedAt(),
                "/friends"
        );
    }

    private NotificationItemResponse messageItem(MessageConversationSummaryResponse conversation) {
        String title = conversation.peer() != null && conversation.peer().displayName() != null
                ? conversation.peer().displayName()
                : conversation.title();
        String preview = conversation.lastMessagePreview() == null || conversation.lastMessagePreview().isBlank()
                ? "Masz nowe wiadomości w rozmowie."
                : conversation.lastMessagePreview();
        return new NotificationItemResponse(
                "message-" + conversation.id(),
                "messages",
                "direct_message",
                "Nowa wiadomość",
                title + ": " + preview,
                false,
                conversation.lastMessageAt(),
                "/messages"
        );
    }

    private Map<Long, UserEntity> loadUsers(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(UserEntity::getId, user -> user));
    }

    private String displayNameFor(UserEntity user) {
        if (user == null) {
            return "Użytkownik";
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            return user.getEmail().split("@")[0];
        }
        return "Użytkownik";
    }

    private String normalizeType(String type) {
        return type == null || type.isBlank() ? "campaign" : type.trim().toLowerCase();
    }

    private String campaignTitle(String type) {
        return switch (type) {
            case "session_started", "session_start" -> "Sesja wystartowała";
            case "session_scheduled", "session_planned" -> "Zaplanowano sesję";
            case "session_updated" -> "Zmieniono termin sesji";
            case "invite", "campaign_invite" -> "Zaproszenie do kampanii";
            case "material", "material_added" -> "Nowy materiał kampanii";
            default -> "Powiadomienie kampanii";
        };
    }
}

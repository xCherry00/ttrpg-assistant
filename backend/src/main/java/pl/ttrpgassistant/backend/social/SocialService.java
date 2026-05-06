package pl.ttrpgassistant.backend.social;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.CampaignMemberRepository;
import pl.ttrpgassistant.backend.campaign.CampaignRepository;
import pl.ttrpgassistant.backend.common.error.DuplicateResourceException;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.social.dto.PublicProfileResponse;
import pl.ttrpgassistant.backend.social.dto.SocialOverviewResponse;
import pl.ttrpgassistant.backend.social.dto.SocialRequestResponse;
import pl.ttrpgassistant.backend.social.dto.SocialUserCardResponse;
import pl.ttrpgassistant.backend.user.ProfileVisibility;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class SocialService {

    private static final Pattern HANDLE_PATTERN = Pattern.compile("^([a-z0-9-]+)-(\\d{4})$");

    private final UserRepository userRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserBlockRepository userBlockRepository;
    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;

    @Transactional(readOnly = true)
    public SocialOverviewResponse getOverview(Long userId) {
        UserEntity currentUser = getUser(userId);

        List<SocialUserCardResponse> friends = friendshipRepository.findByIdUserIdOrderByCreatedAtDesc(userId).stream()
                .map(link -> buildUserCard(currentUser, getUser(link.getId().getFriendUserId())))
                .toList();

        List<SocialRequestResponse> incoming = friendRequestRepository.findByReceiverUserIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING).stream()
                .map(request -> new SocialRequestResponse(
                        request.getId(),
                        buildUserCard(currentUser, getUser(request.getSenderUserId())),
                        request.getCreatedAt()
                ))
                .toList();

        List<SocialRequestResponse> outgoing = friendRequestRepository.findBySenderUserIdAndStatusOrderByCreatedAtDesc(userId, FriendRequestStatus.PENDING).stream()
                .map(request -> new SocialRequestResponse(
                        request.getId(),
                        buildUserCard(currentUser, getUser(request.getReceiverUserId())),
                        request.getCreatedAt()
                ))
                .toList();

        List<SocialUserCardResponse> blocked = userBlockRepository.findByIdBlockerUserId(userId).stream()
                .map(block -> buildUserCard(currentUser, getUser(block.getId().getBlockedUserId())))
                .toList();

        return new SocialOverviewResponse(
                friends,
                incoming,
                outgoing,
                discoverUsers(userId, ""),
                blocked
        );
    }

    @Transactional(readOnly = true)
    public List<SocialUserCardResponse> discoverUsers(Long userId, String query) {
        UserEntity currentUser = getUser(userId);
        String normalizedQuery = query == null ? "" : query.trim();
        Set<Long> candidateIds = new LinkedHashSet<>();

        if (!normalizedQuery.isBlank()) {
            userRepository.searchDiscoverableUsers(userId, normalizedQuery).stream()
                    .map(UserEntity::getId)
                    .forEach(candidateIds::add);
        }

        campaignMemberRepository.findConnectedUserIds(userId).forEach(candidateIds::add);

        return candidateIds.stream()
                .map(this::getUser)
                .filter(candidate -> !candidate.getId().equals(userId))
                .filter(candidate -> normalizedQuery.isBlank() || matchesQuery(candidate, normalizedQuery))
                .filter(candidate -> !isBlockedEitherWay(userId, candidate.getId()))
                .map(candidate -> buildUserCard(currentUser, candidate))
                .limit(24)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(Long viewerUserId, String handle) {
        UserEntity viewer = getUser(viewerUserId);
        UserEntity target = findUserByHandle(handle);

        if (isBlockedEitherWay(viewerUserId, target.getId())) {
            throw new ResourceNotFoundException("User not found");
        }

        boolean isFriend = friendshipRepository.existsByIdUserIdAndIdFriendUserId(viewerUserId, target.getId());
        boolean isOwner = viewerUserId.equals(target.getId());

        if (target.getProfileVisibility() == ProfileVisibility.PRIVATE && !isFriend && !isOwner) {
            throw new ResourceNotFoundException("User not found");
        }

        return new PublicProfileResponse(
                buildUserCard(viewer, target),
                friendshipRepository.countByIdUserId(target.getId()),
                campaignRepository.countVisibleForUser(target.getId()),
                campaignRepository.countByOwnerUserIdAndDeletedAtIsNull(target.getId())
        );
    }

    @Transactional
    public void sendFriendRequest(Long userId, Long targetUserId) {
        validateCanInteract(userId, targetUserId);

        if (friendshipRepository.existsByIdUserIdAndIdFriendUserId(userId, targetUserId)) {
            throw new DuplicateResourceException("User is already on your friends list");
        }

        if (friendRequestRepository.findTopBySenderUserIdAndReceiverUserIdAndStatusOrderByCreatedAtDesc(userId, targetUserId, FriendRequestStatus.PENDING).isPresent()) {
            throw new DuplicateResourceException("Friend request is already pending");
        }

        if (friendRequestRepository.findTopBySenderUserIdAndReceiverUserIdAndStatusOrderByCreatedAtDesc(targetUserId, userId, FriendRequestStatus.PENDING).isPresent()) {
            throw new DuplicateResourceException("This user has already sent you a friend request");
        }

        friendRequestRepository.save(FriendRequestEntity.builder()
                .senderUserId(userId)
                .receiverUserId(targetUserId)
                .status(FriendRequestStatus.PENDING)
                .build());
    }

    @Transactional
    public void acceptFriendRequest(Long userId, Long requestId) {
        FriendRequestEntity request = friendRequestRepository.findByIdAndReceiverUserIdAndStatus(requestId, userId, FriendRequestStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);

        createFriendshipPair(request.getSenderUserId(), request.getReceiverUserId());
    }

    @Transactional
    public void rejectFriendRequest(Long userId, Long requestId) {
        FriendRequestEntity request = friendRequestRepository.findByIdAndReceiverUserIdAndStatus(requestId, userId, FriendRequestStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);
    }

    @Transactional
    public void cancelFriendRequest(Long userId, Long requestId) {
        FriendRequestEntity request = friendRequestRepository.findByIdAndSenderUserIdAndStatus(requestId, userId, FriendRequestStatus.PENDING)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        request.setStatus(FriendRequestStatus.CANCELED);
        request.setRespondedAt(Instant.now());
        friendRequestRepository.save(request);
    }

    @Transactional
    public void removeFriend(Long userId, Long targetUserId) {
        friendshipRepository.deleteByIdUserIdAndIdFriendUserId(userId, targetUserId);
        friendshipRepository.deleteByIdUserIdAndIdFriendUserId(targetUserId, userId);
    }

    @Transactional
    public void blockUser(Long userId, Long targetUserId) {
        validateCanInteract(userId, targetUserId);

        if (!userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(userId, targetUserId)) {
            userBlockRepository.save(UserBlockEntity.builder()
                    .id(new UserBlockId(userId, targetUserId))
                    .build());
        }

        friendshipRepository.deleteByIdUserIdAndIdFriendUserId(userId, targetUserId);
        friendshipRepository.deleteByIdUserIdAndIdFriendUserId(targetUserId, userId);

        friendRequestRepository.findBySenderUserIdAndReceiverUserIdAndStatus(userId, targetUserId, FriendRequestStatus.PENDING)
                .forEach(request -> request.setStatus(FriendRequestStatus.CANCELED));
        friendRequestRepository.findByReceiverUserIdAndSenderUserIdAndStatus(userId, targetUserId, FriendRequestStatus.PENDING)
                .forEach(request -> request.setStatus(FriendRequestStatus.REJECTED));
    }

    @Transactional
    public void unblockUser(Long userId, Long targetUserId) {
        userBlockRepository.deleteByIdBlockerUserIdAndIdBlockedUserId(userId, targetUserId);
    }

    private void validateCanInteract(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new IllegalArgumentException("You cannot perform this action on yourself");
        }

        getUser(targetUserId);

        if (isBlockedEitherWay(userId, targetUserId)) {
            throw new IllegalArgumentException("This user is unavailable for interactions");
        }
    }

    private void createFriendshipPair(Long leftUserId, Long rightUserId) {
        if (!friendshipRepository.existsByIdUserIdAndIdFriendUserId(leftUserId, rightUserId)) {
            friendshipRepository.save(FriendshipEntity.builder()
                    .id(new FriendshipId(leftUserId, rightUserId))
                    .build());
        }

        if (!friendshipRepository.existsByIdUserIdAndIdFriendUserId(rightUserId, leftUserId)) {
            friendshipRepository.save(FriendshipEntity.builder()
                    .id(new FriendshipId(rightUserId, leftUserId))
                    .build());
        }
    }

    private SocialUserCardResponse buildUserCard(UserEntity viewer, UserEntity target) {
        return new SocialUserCardResponse(
                target.getId(),
                handleFor(target),
                target.getUsername(),
                target.getTagCode(),
                displayNameFor(target),
                target.getBio(),
                target.getFavoriteSystem(),
                target.getRole().name(),
                target.isMg(),
                formatActivityLabel(target),
                relationshipFor(viewer.getId(), target.getId()),
                viewer.getId().equals(target.getId()) ? 0 : campaignRepository.countSharedCampaigns(viewer.getId(), target.getId())
        );
    }

    private String relationshipFor(Long viewerUserId, Long targetUserId) {
        if (viewerUserId.equals(targetUserId)) {
            return "SELF";
        }
        if (userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(viewerUserId, targetUserId)) {
            return "BLOCKED_BY_ME";
        }
        if (userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(targetUserId, viewerUserId)) {
            return "BLOCKED_ME";
        }
        if (friendshipRepository.existsByIdUserIdAndIdFriendUserId(viewerUserId, targetUserId)) {
            return "FRIENDS";
        }
        if (friendRequestRepository.findTopBySenderUserIdAndReceiverUserIdAndStatusOrderByCreatedAtDesc(targetUserId, viewerUserId, FriendRequestStatus.PENDING).isPresent()) {
            return "INCOMING_REQUEST";
        }
        if (friendRequestRepository.findTopBySenderUserIdAndReceiverUserIdAndStatusOrderByCreatedAtDesc(viewerUserId, targetUserId, FriendRequestStatus.PENDING).isPresent()) {
            return "OUTGOING_REQUEST";
        }
        return "NONE";
    }

    private boolean isBlockedEitherWay(Long leftUserId, Long rightUserId) {
        return userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(leftUserId, rightUserId)
                || userBlockRepository.existsByIdBlockerUserIdAndIdBlockedUserId(rightUserId, leftUserId);
    }

    private boolean matchesQuery(UserEntity candidate, String query) {
        String lowered = query.toLowerCase(Locale.ROOT);
        String candidateText = (displayNameFor(candidate) + " " + candidate.getUsername() + " " + formatTag(candidate)).toLowerCase(Locale.ROOT);
        return candidateText.contains(lowered);
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

    private String formatTag(UserEntity user) {
        return user.getUsername() + "#" + String.format("%04d", user.getTagCode());
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

    private UserEntity findUserByHandle(String handle) {
        Matcher matcher = HANDLE_PATTERN.matcher(handle == null ? "" : handle.trim().toLowerCase(Locale.ROOT));
        if (!matcher.matches()) {
            throw new ResourceNotFoundException("User not found");
        }

        String username = matcher.group(1);
        Integer tagCode = Integer.parseInt(matcher.group(2));

        return userRepository.findByUsernameIgnoreCaseAndTagCode(username, tagCode)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserEntity getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}

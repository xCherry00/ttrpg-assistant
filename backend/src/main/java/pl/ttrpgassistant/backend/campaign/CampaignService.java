package pl.ttrpgassistant.backend.campaign;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberActionResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignFriendCandidateResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignResponse;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignRequest;
import pl.ttrpgassistant.backend.common.error.ResourceNotFoundException;
import pl.ttrpgassistant.backend.social.FriendshipRepository;
import pl.ttrpgassistant.backend.user.UserEntity;
import pl.ttrpgassistant.backend.user.UserRepository;

import java.security.SecureRandom;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;

    private final CampaignRepository campaignRepository;
    private final CampaignMemberRepository campaignMemberRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final CampaignWorkspaceService campaignWorkspaceService;
    private final SecureRandom random = new SecureRandom();

    @Transactional(readOnly = true)
    public List<CampaignSummaryResponse> listForUser(Long userId) {
        List<CampaignEntity> campaigns = campaignRepository.findVisibleForUser(userId);
        Map<Long, String> memberRoles = campaignMemberRepository.findByIdUserId(userId).stream()
                .collect(Collectors.toMap(
                        member -> member.getId().getCampaignId(),
                        member -> member.getRole().toUpperCase(Locale.ROOT),
                        (left, right) -> left
                ));

        return campaigns.stream()
                .map(campaign -> toSummary(campaign, userId, memberRoles.get(campaign.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CampaignSummaryResponse getForUser(Long userId, Long campaignId) {
        CampaignEntity campaign = requireCampaignMemberAccess(userId, campaignId);
        String memberRole = resolveMembershipRole(userId, campaign);
        return toSummary(campaign, userId, memberRole);
    }

    @Transactional(readOnly = true)
    public List<CampaignFriendCandidateResponse> listFriendCandidates(Long userId, Long campaignId) {
        CampaignEntity campaign = requireCampaignOwner(userId, campaignId);

        List<Long> existingMemberIds = campaignMemberRepository.findByIdCampaignId(campaignId).stream()
                .map(member -> member.getId().getUserId())
                .toList();

        return friendshipRepository.findByIdUserIdOrderByCreatedAtDesc(userId).stream()
                .map(friendship -> friendship.getId().getFriendUserId())
                .filter(friendUserId -> !existingMemberIds.contains(friendUserId))
                .map(this::getUser)
                .map(friend -> new CampaignFriendCandidateResponse(
                        friend.getId(),
                        displayNameFor(friend),
                        friend.getUsername(),
                        friend.getTagCode(),
                        friend.getUsername() + "-" + String.format("%04d", friend.getTagCode())
                ))
                .toList();
    }

    @Transactional
    public CampaignSummaryResponse create(Long userId, CreateCampaignRequest req) {
        CampaignEntity campaign = CampaignEntity.builder()
                .ownerUserId(userId)
                .title(req.title().trim())
                .systemCode(normalizeSystemCode(req.systemCode()))
                .descriptionMd(Optional.ofNullable(req.description()).orElse("").trim())
                .coverImageUrl(normalizeCoverImageUrl(req.coverImageUrl()))
                .status("active")
                .joinCode(generateUniqueCode())
                .build();

        campaign = campaignRepository.save(campaign);

        CampaignMemberEntity ownerMembership = CampaignMemberEntity.builder()
                .id(new CampaignMemberId(campaign.getId(), userId))
                .role("gm")
                .build();
        campaignMemberRepository.save(ownerMembership);

        elevateUserToMg(userId);

        return toSummary(campaign, userId, "GM");
    }

    @Transactional
    public JoinCampaignResponse join(Long userId, JoinCampaignRequest req) {
        String code = req.code().trim().toUpperCase(Locale.ROOT);
        CampaignEntity campaign = campaignRepository.findByJoinCodeAndDeletedAtIsNull(code)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found for this code"));

        if (campaign.getOwnerUserId().equals(userId)) {
            CampaignSummaryResponse summary = toSummary(campaign, userId, "GM");
            return new JoinCampaignResponse(summary, false, "You are the campaign creator.");
        }

        CampaignMemberId memberId = new CampaignMemberId(campaign.getId(), userId);
        boolean exists = campaignMemberRepository.existsById(memberId);
        if (!exists) {
            CampaignMemberEntity member = CampaignMemberEntity.builder()
                    .id(memberId)
                    .role("player")
                    .build();
            campaignMemberRepository.save(member);
        }

        CampaignSummaryResponse summary = toSummary(campaign, userId, "PLAYER");
        if (!exists) {
            campaignWorkspaceService.notifyCampaignMembers(campaign.getId(), userId, "MEMBER_JOINED", displayNameFor(getUser(userId)) + " dolaczyl do kampanii.", true);
        }
        return new JoinCampaignResponse(summary, !exists, exists ? "You already belong to this campaign." : "Joined campaign successfully.");
    }

    @Transactional
    public CampaignSummaryResponse addFriendToCampaign(Long userId, Long campaignId, Long friendUserId) {
        CampaignEntity campaign = requireCampaignOwner(userId, campaignId);

        if (!friendshipRepository.existsByIdUserIdAndIdFriendUserId(userId, friendUserId)) {
            throw new IllegalArgumentException("You can only add users from your friends list");
        }

        UserEntity friend = getUser(friendUserId);
        CampaignMemberId memberId = new CampaignMemberId(campaignId, friend.getId());
        if (!campaignMemberRepository.existsById(memberId)) {
            CampaignMemberEntity member = CampaignMemberEntity.builder()
                    .id(memberId)
                    .role("player")
                    .build();
            campaignMemberRepository.save(member);
            campaignWorkspaceService.notifyCampaignMembers(campaignId, userId, "MEMBER_ADDED", displayNameFor(friend) + " zostal dodany do kampanii.", true);
        }

        return toSummary(campaign, userId, resolveMembershipRole(userId, campaign));
    }

    @Transactional(readOnly = true)
    public List<CampaignMemberResponse> listMembers(Long userId, Long campaignId) {
        CampaignEntity campaign = requireCampaignMemberAccess(userId, campaignId);
        List<CampaignMemberEntity> memberships = campaignMemberRepository.findByIdCampaignId(campaignId);
        Map<Long, UserEntity> usersById = userRepository.findAllById(
                memberships.stream().map(member -> member.getId().getUserId()).toList()
        ).stream().collect(Collectors.toMap(UserEntity::getId, user -> user));

        return memberships.stream()
                .map(member -> toMemberResponse(member, campaign, userId, usersById.get(member.getId().getUserId())))
                .filter(member -> member != null)
                .sorted(Comparator
                        .comparing(CampaignMemberResponse::owner).reversed()
                        .thenComparing(CampaignMemberResponse::mg).reversed()
                        .thenComparing(CampaignMemberResponse::displayName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public CampaignMemberActionResponse removeMember(Long userId, Long campaignId, Long targetUserId) {
        CampaignEntity campaign = requireCampaignOwner(userId, campaignId);

        if (campaign.getOwnerUserId().equals(targetUserId)) {
            throw new IllegalArgumentException("Campaign owner cannot be removed");
        }

        CampaignMemberId targetMemberId = new CampaignMemberId(campaignId, targetUserId);
        CampaignMemberEntity targetMember = campaignMemberRepository.findById(targetMemberId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign member not found"));
        campaignMemberRepository.delete(targetMember);
        String displayName = displayNameFor(getUser(targetUserId));
        campaignWorkspaceService.notifyCampaignMembers(campaignId, userId, "MEMBER_REMOVED", displayName + " zostal usuniety z kampanii.", true);
        return new CampaignMemberActionResponse(true, displayName + " has been removed from the campaign.");
    }

    @Transactional
    public CampaignMemberActionResponse leaveCampaign(Long userId, Long campaignId) {
        CampaignEntity campaign = requireCampaignMemberAccess(userId, campaignId);
        if (campaign.getOwnerUserId().equals(userId)) {
            throw new IllegalArgumentException("Campaign owner cannot leave without transferring ownership.");
        }

        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        CampaignMemberEntity member = campaignMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign member not found"));
        campaignMemberRepository.delete(member);
        campaignWorkspaceService.notifyCampaignMembers(campaignId, userId, "MEMBER_LEFT", displayNameFor(getUser(userId)) + " opuscil kampanie.", false);

        return new CampaignMemberActionResponse(true, "You left the campaign.");
    }

    private CampaignSummaryResponse toSummary(CampaignEntity campaign, Long userId, String membershipRole) {
        boolean owner = campaign.getOwnerUserId().equals(userId);
        String role = owner ? "GM" : (membershipRole == null || membershipRole.isBlank() ? "PLAYER" : membershipRole);

        return new CampaignSummaryResponse(
                campaign.getId(),
                campaign.getTitle(),
                campaign.getSystemCode(),
                campaign.getDescriptionMd(),
                campaign.getCoverImageUrl(),
                campaign.getStatus(),
                campaign.getJoinCode(),
                "/campaigns/join?code=" + campaign.getJoinCode(),
                role,
                owner,
                campaign.getCreatedAt(),
                campaign.getUpdatedAt()
        );
    }

    private CampaignMemberResponse toMemberResponse(
            CampaignMemberEntity member,
            CampaignEntity campaign,
            Long currentUserId,
            UserEntity user
    ) {
        if (user == null) {
            return null;
        }

        boolean owner = campaign.getOwnerUserId().equals(user.getId());
        return new CampaignMemberResponse(
                user.getId(),
                displayNameFor(user),
                user.getUsername(),
                user.getTagCode(),
                user.getUsername() + "-" + String.format("%04d", user.getTagCode()),
                owner ? "GM" : member.getRole().toUpperCase(Locale.ROOT),
                owner,
                user.isMg(),
                user.getId().equals(currentUserId),
                member.getCreatedAt()
        );
    }

    private CampaignEntity requireCampaignOwner(Long userId, Long campaignId) {
        CampaignEntity campaign = requireCampaignMemberAccess(userId, campaignId);
        if (!campaign.getOwnerUserId().equals(userId)) {
            throw new ResourceNotFoundException("Campaign not found");
        }
        return campaign;
    }

    private CampaignEntity requireCampaignMemberAccess(Long userId, Long campaignId) {
        CampaignEntity campaign = campaignRepository.findByIdAndDeletedAtIsNull(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));

        if (campaign.getOwnerUserId().equals(userId)) {
            return campaign;
        }

        CampaignMemberId memberId = new CampaignMemberId(campaignId, userId);
        campaignMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found"));
        return campaign;
    }

    private String resolveMembershipRole(Long userId, CampaignEntity campaign) {
        if (campaign.getOwnerUserId().equals(userId)) {
            return "GM";
        }

        CampaignMemberId memberId = new CampaignMemberId(campaign.getId(), userId);
        return campaignMemberRepository.findById(memberId)
                .map(member -> member.getRole().toUpperCase(Locale.ROOT))
                .orElse("PLAYER");
    }

    private String normalizeSystemCode(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "dnd5e";
        }
        return rawValue.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeCoverImageUrl(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void elevateUserToMg(Long userId) {
        UserEntity user = getUser(userId);
        if (!user.isMg()) {
            user.setMg(true);
            userRepository.save(user);
        }
    }

    private UserEntity getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private String displayNameFor(UserEntity user) {
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName().trim();
        }
        return user.getUsername();
    }

    private String generateUniqueCode() {
        for (int attempts = 0; attempts < 20; attempts++) {
            String code = randomCode();
            if (campaignRepository.findByJoinCodeAndDeletedAtIsNull(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Could not generate unique campaign code");
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            int index = random.nextInt(CODE_ALPHABET.length());
            builder.append(CODE_ALPHABET.charAt(index));
        }
        return builder.toString();
    }
}

package pl.ttrpgassistant.backend.campaign;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMaterialResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberActionResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignNotificationResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionAttendanceResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionMessageResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignFriendCandidateResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignMaterialRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionMessageRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionAttendanceRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpsertCampaignSessionNoteRequest;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final CampaignWorkspaceService campaignWorkspaceService;

    @GetMapping
    public List<CampaignSummaryResponse> list(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.listForUser(userId);
    }

    @GetMapping("/{id}")
    public CampaignSummaryResponse getById(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.getForUser(userId, id);
    }

    @GetMapping("/{id}/friend-candidates")
    public List<CampaignFriendCandidateResponse> friendCandidates(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.listFriendCandidates(userId, id);
    }

    @GetMapping("/{id}/members")
    public List<CampaignMemberResponse> members(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.listMembers(userId, id);
    }

    @PostMapping
    public CampaignSummaryResponse create(
            Authentication auth,
            @Valid @RequestBody CreateCampaignRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.create(userId, request);
    }

    @PatchMapping("/{id}")
    public CampaignSummaryResponse update(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCampaignRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.updateCampaign(userId, id, request);
    }

    @PostMapping("/join")
    public JoinCampaignResponse join(
            Authentication auth,
            @Valid @RequestBody JoinCampaignRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.join(userId, request);
    }

    @PostMapping("/{id}/friends/{friendUserId}")
    public CampaignSummaryResponse addFriendToCampaign(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long friendUserId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.addFriendToCampaign(userId, id, friendUserId);
    }

    @DeleteMapping("/{id}/members/{memberUserId}")
    public CampaignMemberActionResponse removeMember(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long memberUserId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.removeMember(userId, id, memberUserId);
    }

    @PostMapping("/{id}/leave")
    public CampaignMemberActionResponse leaveCampaign(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.leaveCampaign(userId, id);
    }

    @GetMapping("/{id}/sessions")
    public List<CampaignSessionSummaryResponse> listSessions(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.listSessions(userId, id);
    }

    @PostMapping("/{id}/sessions")
    public CampaignSessionSummaryResponse createSession(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateCampaignSessionRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.createSession(userId, id, request);
    }

    @PostMapping("/{id}/sessions/{sessionId}/start")
    public CampaignSessionSummaryResponse startSession(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.startSession(userId, id, sessionId);
    }

    @PostMapping("/{id}/sessions/{sessionId}/finish")
    public CampaignSessionSummaryResponse finishSession(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.finishSession(userId, id, sessionId);
    }

    @GetMapping("/{id}/sessions/{sessionId}/attendance")
    public List<CampaignSessionAttendanceResponse> listAttendance(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.listAttendance(userId, id, sessionId);
    }

    @PostMapping("/{id}/sessions/{sessionId}/attendance")
    public List<CampaignSessionAttendanceResponse> updateAttendance(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateSessionAttendanceRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.updateAttendance(userId, id, sessionId, request);
    }

    @GetMapping("/{id}/sessions/{sessionId}/messages")
    public List<CampaignSessionMessageResponse> listMessages(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.listMessages(userId, id, sessionId);
    }

    @PostMapping("/{id}/sessions/{sessionId}/messages")
    public CampaignSessionMessageResponse addMessage(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long sessionId,
            @Valid @RequestBody CreateCampaignSessionMessageRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.addMessage(userId, id, sessionId, request);
    }

    @GetMapping("/{id}/sessions/{sessionId}/note")
    public CampaignSessionNoteResponse getNote(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.getNote(userId, id, sessionId);
    }

    @PutMapping("/{id}/sessions/{sessionId}/note")
    public CampaignSessionNoteResponse upsertNote(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long sessionId,
            @RequestBody UpsertCampaignSessionNoteRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.upsertNote(userId, id, sessionId, request);
    }

    @GetMapping("/{id}/notifications")
    public List<CampaignNotificationResponse> notifications(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.listNotifications(userId, id);
    }

    @PostMapping("/{id}/notifications/{notificationId}/read")
    public CampaignNotificationResponse markNotificationRead(Authentication auth, @PathVariable Long id, @PathVariable Long notificationId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.markNotificationRead(userId, id, notificationId);
    }

    @GetMapping("/{id}/materials")
    public List<CampaignMaterialResponse> materials(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.listMaterials(userId, id);
    }

    @PostMapping("/{id}/materials")
    public CampaignMaterialResponse createMaterial(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateCampaignMaterialRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignWorkspaceService.createMaterial(userId, id, request);
    }
}

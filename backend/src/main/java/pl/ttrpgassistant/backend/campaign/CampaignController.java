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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMaterialResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberActionResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignMemberResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignNotificationResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionMessageResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSessionSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignPlayerNoteResponse;
import pl.ttrpgassistant.backend.campaign.dto.CampaignFriendCandidateResponse;
import pl.ttrpgassistant.backend.campaign.dto.AssignCharacterToCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.CampaignCharacterResponse;
import pl.ttrpgassistant.backend.campaign.dto.CombatEncounterResponse;
import pl.ttrpgassistant.backend.campaign.dto.CreateDiceRollRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignMaterialRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCombatEncounterRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionMessageRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignSessionRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.JoinCampaignResponse;
import pl.ttrpgassistant.backend.campaign.dto.AddCombatParticipantRequest;
import pl.ttrpgassistant.backend.campaign.dto.ApplyDamageRequest;
import pl.ttrpgassistant.backend.campaign.dto.ApplyHealingRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCombatParticipantRequest;
import pl.ttrpgassistant.backend.campaign.dto.ReorderParticipantsRequest;
import pl.ttrpgassistant.backend.campaign.dto.SetParticipantConditionsRequest;
import pl.ttrpgassistant.backend.campaign.dto.SetTemporaryHpRequest;
import pl.ttrpgassistant.backend.campaign.dto.SessionLiveStateResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCampaignRequest;
import pl.ttrpgassistant.backend.campaign.dto.DiceRollResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionLiveStateRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateSessionAttendanceRequest;
import pl.ttrpgassistant.backend.campaign.dto.SessionAttendanceSummaryResponse;
import pl.ttrpgassistant.backend.campaign.dto.UpsertCampaignSessionNoteRequest;
import pl.ttrpgassistant.backend.campaign.dto.CreateCampaignPlayerNoteRequest;
import pl.ttrpgassistant.backend.campaign.dto.UpdateCampaignPlayerNoteRequest;
import pl.ttrpgassistant.backend.common.pagination.PagedResponse;

import java.util.List;
import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;
    private final CampaignWorkspaceService campaignWorkspaceService;
    private final CampaignSessionAttendanceService campaignSessionAttendanceService;
    private final CampaignPlayerNoteService campaignPlayerNoteService;
    private final CampaignCharacterService campaignCharacterService;
    private final CombatEncounterService combatEncounterService;
    private final DiceRollService diceRollService;
    private final SessionLiveStateService sessionLiveStateService;

    @GetMapping
    public PagedResponse<CampaignSummaryResponse> list(
            Authentication auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Long userId = (Long) auth.getPrincipal();
        return PagedResponse.of(campaignService.listForUser(userId), page, size);
    }

    @GetMapping("/public")
    public PagedResponse<CampaignSummaryResponse> publicCampaigns(
            Authentication auth,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        Long userId = (Long) auth.getPrincipal();
        return PagedResponse.of(campaignService.listJoinablePublic(userId), page, size);
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

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void softDelete(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        campaignWorkspaceService.softDeleteCampaign(userId, id);
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

    @PostMapping("/{id}/favorite")
    public CampaignSummaryResponse toggleFavorite(
            Authentication auth,
            @PathVariable Long id
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignService.toggleFavorite(userId, id);
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
    public SessionAttendanceSummaryResponse listAttendance(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return campaignSessionAttendanceService.getAttendance(userId, id, sessionId);
    }

    @PutMapping("/{id}/sessions/{sessionId}/attendance/me")
    public SessionAttendanceSummaryResponse updateAttendance(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateSessionAttendanceRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignSessionAttendanceService.upsertMyAttendance(userId, id, sessionId, request);
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

    @GetMapping("/{id}/sessions/{sessionId}/live-state")
    public SessionLiveStateResponse getLiveState(Authentication auth, @PathVariable Long id, @PathVariable Long sessionId) {
        Long userId = (Long) auth.getPrincipal();
        return sessionLiveStateService.getState(userId, id, sessionId);
    }

    @PatchMapping("/{id}/sessions/{sessionId}/live-state")
    public SessionLiveStateResponse updateLiveState(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long sessionId,
            @Valid @RequestBody UpdateSessionLiveStateRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return sessionLiveStateService.updateState(userId, id, sessionId, request);
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

    @GetMapping("/{id}/player-notes")
    public List<CampaignPlayerNoteResponse> listPlayerNotes(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return campaignPlayerNoteService.list(userId, id);
    }

    @PostMapping("/{id}/player-notes")
    public CampaignPlayerNoteResponse createPlayerNote(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateCampaignPlayerNoteRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignPlayerNoteService.create(userId, id, request);
    }

    @PatchMapping("/{id}/player-notes/{noteId}")
    public CampaignPlayerNoteResponse updatePlayerNote(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long noteId,
            @Valid @RequestBody UpdateCampaignPlayerNoteRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignPlayerNoteService.update(userId, id, noteId, request);
    }

    @DeleteMapping("/{id}/player-notes/{noteId}")
    @ResponseStatus(NO_CONTENT)
    public void deletePlayerNote(Authentication auth, @PathVariable Long id, @PathVariable Long noteId) {
        Long userId = (Long) auth.getPrincipal();
        campaignPlayerNoteService.delete(userId, id, noteId);
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

    @PostMapping("/{id}/characters")
    public CampaignCharacterResponse assignCharacter(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AssignCharacterToCampaignRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return campaignCharacterService.assignCharacter(userId, id, request);
    }

    @GetMapping("/{id}/characters")
    public List<CampaignCharacterResponse> listCampaignCharacters(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return campaignCharacterService.listCampaignCharacters(userId, id);
    }

    @DeleteMapping("/{id}/characters/{characterId}")
    @ResponseStatus(NO_CONTENT)
    public void detachCharacter(Authentication auth, @PathVariable Long id, @PathVariable Long characterId) {
        Long userId = (Long) auth.getPrincipal();
        campaignCharacterService.detachCharacter(userId, id, characterId);
    }

    @PostMapping("/{id}/encounters")
    public CombatEncounterResponse createEncounter(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateCombatEncounterRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.createEncounter(userId, id, request);
    }

    @GetMapping("/{id}/encounters")
    public List<CombatEncounterResponse> listEncounters(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.listEncounters(userId, id);
    }

    @GetMapping("/{id}/encounters/{encounterId}")
    public CombatEncounterResponse getEncounter(Authentication auth, @PathVariable Long id, @PathVariable Long encounterId) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.getEncounter(userId, id, encounterId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants")
    public CombatEncounterResponse addEncounterParticipant(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @Valid @RequestBody AddCombatParticipantRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.addParticipant(userId, id, encounterId, request);
    }

    @PatchMapping("/{id}/encounters/{encounterId}/participants/{participantId}")
    public CombatEncounterResponse updateEncounterParticipant(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId,
            @Valid @RequestBody UpdateCombatParticipantRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.updateParticipant(userId, id, encounterId, participantId, request);
    }

    @DeleteMapping("/{id}/encounters/{encounterId}/participants/{participantId}")
    public CombatEncounterResponse removeEncounterParticipant(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.removeParticipant(userId, id, encounterId, participantId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/damage")
    public CombatEncounterResponse applyParticipantDamage(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId,
            @Valid @RequestBody ApplyDamageRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.applyDamage(userId, id, encounterId, participantId, request.amount());
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/heal")
    public CombatEncounterResponse applyParticipantHealing(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId,
            @Valid @RequestBody ApplyHealingRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.applyHealing(userId, id, encounterId, participantId, request.amount());
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/temporary-hp")
    public CombatEncounterResponse setParticipantTemporaryHp(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId,
            @Valid @RequestBody SetTemporaryHpRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.setTemporaryHp(userId, id, encounterId, participantId, request.amount());
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/conditions")
    public CombatEncounterResponse setParticipantConditions(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId,
            @Valid @RequestBody SetParticipantConditionsRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.setConditions(userId, id, encounterId, participantId, request.conditions());
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/defeat")
    public CombatEncounterResponse defeatParticipant(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.defeatParticipant(userId, id, encounterId, participantId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/{participantId}/restore")
    public CombatEncounterResponse restoreParticipant(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @PathVariable Long participantId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.restoreParticipant(userId, id, encounterId, participantId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/participants/reorder")
    public CombatEncounterResponse reorderEncounterParticipants(
            Authentication auth,
            @PathVariable Long id,
            @PathVariable Long encounterId,
            @Valid @RequestBody ReorderParticipantsRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.reorderParticipants(userId, id, encounterId, request.participantIds());
    }

    @PostMapping("/{id}/encounters/{encounterId}/next-turn")
    public CombatEncounterResponse nextEncounterTurn(Authentication auth, @PathVariable Long id, @PathVariable Long encounterId) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.nextTurn(userId, id, encounterId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/previous-turn")
    public CombatEncounterResponse previousEncounterTurn(Authentication auth, @PathVariable Long id, @PathVariable Long encounterId) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.previousTurn(userId, id, encounterId);
    }

    @PostMapping("/{id}/encounters/{encounterId}/finish")
    public CombatEncounterResponse finishEncounter(Authentication auth, @PathVariable Long id, @PathVariable Long encounterId) {
        Long userId = (Long) auth.getPrincipal();
        return combatEncounterService.finishEncounter(userId, id, encounterId);
    }

    @DeleteMapping("/{id}/encounters/{encounterId}")
    @ResponseStatus(NO_CONTENT)
    public void softDeleteEncounter(Authentication auth, @PathVariable Long id, @PathVariable Long encounterId) {
        Long userId = (Long) auth.getPrincipal();
        combatEncounterService.softDeleteEncounter(userId, id, encounterId);
    }

    @PostMapping("/{id}/dice-rolls")
    public DiceRollResponse createDiceRoll(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody CreateDiceRollRequest request
    ) {
        Long userId = (Long) auth.getPrincipal();
        return diceRollService.createRoll(userId, id, request);
    }

    @GetMapping("/{id}/dice-rolls")
    public List<DiceRollResponse> listDiceRolls(
            Authentication auth,
            @PathVariable Long id,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(required = false) Long encounterId,
            @RequestParam(required = false) Long characterId
    ) {
        Long userId = (Long) auth.getPrincipal();
        return diceRollService.listRolls(userId, id, limit, sessionId, encounterId, characterId);
    }

    @GetMapping("/{id}/dice-rolls/{rollId}")
    public DiceRollResponse getDiceRoll(Authentication auth, @PathVariable Long id, @PathVariable Long rollId) {
        Long userId = (Long) auth.getPrincipal();
        return diceRollService.getRoll(userId, id, rollId);
    }

    @DeleteMapping("/{id}/dice-rolls/{rollId}")
    @ResponseStatus(NO_CONTENT)
    public void softDeleteDiceRoll(Authentication auth, @PathVariable Long id, @PathVariable Long rollId) {
        Long userId = (Long) auth.getPrincipal();
        diceRollService.softDeleteRoll(userId, id, rollId);
    }
}

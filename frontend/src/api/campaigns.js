import { http, unwrapPage } from "./http";

export async function listCampaigns(token) {
  return unwrapPage(await http("/api/campaigns", {
    method: "GET",
    token,
  }));
}

export async function listPublicCampaigns(token) {
  return unwrapPage(await http("/api/campaigns/public", {
    method: "GET",
    token,
  }));
}

export async function getCampaignById(token, campaignId) {
  return http(`/api/campaigns/${campaignId}`, {
    method: "GET",
    token,
  });
}

export async function createCampaign(token, payload) {
  return http("/api/campaigns", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function joinCampaign(token, code) {
  return http("/api/campaigns/join", {
    method: "POST",
    token,
    body: { code },
  });
}

export async function listCampaignFriendCandidates(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/friend-candidates`, {
    method: "GET",
    token,
  });
}

export async function addFriendToCampaign(token, campaignId, friendUserId) {
  return http(`/api/campaigns/${campaignId}/friends/${friendUserId}`, {
    method: "POST",
    token,
  });
}

export async function listCampaignMembers(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/members`, {
    method: "GET",
    token,
  });
}

export async function removeCampaignMember(token, campaignId, memberUserId) {
  return http(`/api/campaigns/${campaignId}/members/${memberUserId}`, {
    method: "DELETE",
    token,
  });
}

export async function leaveCampaign(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/leave`, {
    method: "POST",
    token,
  });
}

export async function updateCampaign(token, campaignId, body) {
  return http(`/api/campaigns/${campaignId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteCampaign(token, campaignId) {
  return http(`/api/campaigns/${campaignId}`, {
    method: "DELETE",
    token,
  });
}

export async function toggleCampaignFavorite(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/favorite`, {
    method: "POST",
    token,
  });
}

export async function listCampaignSessions(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/sessions`, {
    method: "GET",
    token,
  });
}

export async function createCampaignSession(token, campaignId, body) {
  return http(`/api/campaigns/${campaignId}/sessions`, {
    method: "POST",
    token,
    body,
  });
}

export async function startCampaignSession(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/start`, {
    method: "POST",
    token,
  });
}

export async function finishCampaignSession(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/finish`, {
    method: "POST",
    token,
  });
}

export async function listSessionAttendance(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/attendance`, {
    method: "GET",
    token,
  });
}

export async function updateSessionAttendance(token, campaignId, sessionId, status) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/attendance`, {
    method: "POST",
    token,
    body: { status },
  });
}

export async function listSessionMessages(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/messages`, {
    method: "GET",
    token,
  });
}

export async function sendSessionMessage(token, campaignId, sessionId, content) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/messages`, {
    method: "POST",
    token,
    body: { content },
  });
}

export async function getSessionNote(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/note`, {
    method: "GET",
    token,
  });
}

export async function saveSessionNote(token, campaignId, sessionId, body) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/note`, {
    method: "PUT",
    token,
    body,
  });
}

export async function getSessionLiveState(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/live-state`, {
    method: "GET",
    token,
  });
}

export async function updateSessionLiveState(token, campaignId, sessionId, body) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/live-state`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function listCampaignNotifications(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/notifications`, {
    method: "GET",
    token,
  });
}

export async function markCampaignNotificationRead(token, campaignId, notificationId) {
  return http(`/api/campaigns/${campaignId}/notifications/${notificationId}/read`, {
    method: "POST",
    token,
  });
}

export async function listCampaignMaterials(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/materials`, {
    method: "GET",
    token,
  });
}

export async function createCampaignMaterial(token, campaignId, body) {
  return http(`/api/campaigns/${campaignId}/materials`, {
    method: "POST",
    token,
    body,
  });
}

export async function assignCharacterToCampaign(token, campaignId, characterId) {
  return http(`/api/campaigns/${campaignId}/characters`, {
    method: "POST",
    token,
    body: { characterId },
  });
}

export async function getCampaignCharacters(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/characters`, {
    method: "GET",
    token,
  });
}

export async function detachCharacterFromCampaign(token, campaignId, characterId) {
  return http(`/api/campaigns/${campaignId}/characters/${characterId}`, {
    method: "DELETE",
    token,
  });
}

export async function createEncounter(token, campaignId, payload) {
  return http(`/api/campaigns/${campaignId}/encounters`, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getCampaignEncounters(token, campaignId) {
  return http(`/api/campaigns/${campaignId}/encounters`, {
    method: "GET",
    token,
  });
}

export async function getEncounter(token, campaignId, encounterId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}`, {
    method: "GET",
    token,
  });
}

export async function addEncounterParticipant(token, campaignId, encounterId, payload) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants`, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateEncounterParticipant(token, campaignId, encounterId, participantId, payload) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function removeEncounterParticipant(token, campaignId, encounterId, participantId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}`, {
    method: "DELETE",
    token,
  });
}

export async function applyParticipantDamage(token, campaignId, encounterId, participantId, amount) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/damage`, {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function healParticipant(token, campaignId, encounterId, participantId, amount) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/heal`, {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function setParticipantTemporaryHp(token, campaignId, encounterId, participantId, amount) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/temporary-hp`, {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function setParticipantConditions(token, campaignId, encounterId, participantId, conditions) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/conditions`, {
    method: "POST",
    token,
    body: { conditions },
  });
}

export async function defeatParticipant(token, campaignId, encounterId, participantId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/defeat`, {
    method: "POST",
    token,
  });
}

export async function restoreParticipant(token, campaignId, encounterId, participantId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/participants/${participantId}/restore`, {
    method: "POST",
    token,
  });
}

export async function nextEncounterTurn(token, campaignId, encounterId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/next-turn`, {
    method: "POST",
    token,
  });
}

export async function previousEncounterTurn(token, campaignId, encounterId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/previous-turn`, {
    method: "POST",
    token,
  });
}

export async function finishEncounter(token, campaignId, encounterId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}/finish`, {
    method: "POST",
    token,
  });
}

export async function deleteEncounter(token, campaignId, encounterId) {
  return http(`/api/campaigns/${campaignId}/encounters/${encounterId}`, {
    method: "DELETE",
    token,
  });
}

export async function createDiceRoll(token, campaignId, payload) {
  return http(`/api/campaigns/${campaignId}/dice-rolls`, {
    method: "POST",
    token,
    body: payload,
  });
}

export async function getCampaignDiceRolls(token, campaignId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.limit != null) params.set("limit", String(filters.limit));
  if (filters.sessionId != null) params.set("sessionId", String(filters.sessionId));
  if (filters.encounterId != null) params.set("encounterId", String(filters.encounterId));
  if (filters.characterId != null) params.set("characterId", String(filters.characterId));
  const query = params.toString();
  return http(`/api/campaigns/${campaignId}/dice-rolls${query ? `?${query}` : ""}`, {
    method: "GET",
    token,
  });
}

export async function getDiceRoll(token, campaignId, rollId) {
  return http(`/api/campaigns/${campaignId}/dice-rolls/${rollId}`, {
    method: "GET",
    token,
  });
}

export async function deleteDiceRoll(token, campaignId, rollId) {
  return http(`/api/campaigns/${campaignId}/dice-rolls/${rollId}`, {
    method: "DELETE",
    token,
  });
}

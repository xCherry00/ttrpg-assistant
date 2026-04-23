import { http } from "./http";

export async function listCampaigns(token) {
  return http("/api/campaigns", {
    method: "GET",
    token,
  });
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

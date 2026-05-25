import { http } from "./http";

export async function getMySessionNote(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/notes/me`, {
    method: "GET",
    token,
  });
}

export async function saveMySessionNote(token, campaignId, sessionId, payload) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/notes/me`, {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteMySessionNote(token, campaignId, sessionId) {
  return http(`/api/campaigns/${campaignId}/sessions/${sessionId}/notes/me`, {
    method: "DELETE",
    token,
  });
}

export async function getSessionNoteBacklog(token) {
  return http("/api/dashboard/session-note-backlog", {
    method: "GET",
    token,
  });
}

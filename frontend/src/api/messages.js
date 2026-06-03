import { http, httpRequest, unwrapPage } from "./http";

export async function getConversations(token, filter = "all") {
  return unwrapPage(await http(`/api/messages/conversations?filter=${encodeURIComponent(filter)}`, { method: "GET", token }));
}

export async function getConversationMessages(token, conversationId, { beforeId, limit = 40 } = {}) {
  const params = new URLSearchParams();
  if (beforeId) params.set("beforeId", String(beforeId));
  if (limit) params.set("limit", String(limit));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return http(`/api/messages/conversations/${conversationId}/messages${suffix}`, { method: "GET", token });
}

export async function startDirectConversation(token, targetUserId) {
  return http(`/api/messages/direct/${targetUserId}`, { method: "POST", token });
}

export async function sendTextMessage(token, conversationId, content) {
  return http(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    token,
    body: { content },
  });
}

export async function sendMessageWithFiles(token, conversationId, { content = "", files = [] }) {
  const form = new FormData();
  form.set("content", content || "");
  for (const file of files) {
    form.append("files", file);
  }
  return http(`/api/messages/conversations/${conversationId}/messages-with-files`, {
    method: "POST",
    token,
    body: form,
  });
}

export async function markConversationRead(token, conversationId) {
  return http(`/api/messages/conversations/${conversationId}/read`, { method: "POST", token });
}

export async function acceptConversationRequest(token, conversationId) {
  return http(`/api/messages/conversations/${conversationId}/accept`, { method: "POST", token });
}

export async function rejectConversationRequest(token, conversationId) {
  return http(`/api/messages/conversations/${conversationId}/reject`, { method: "POST", token });
}

export async function getUnreadMessagesCount(token) {
  return http("/api/messages/unread-count", { method: "GET", token });
}

export async function downloadAttachment(token, attachmentId) {
  const response = await httpRequest(`/api/messages/attachments/${attachmentId}`, {
    method: "GET",
    token,
    responseType: "response",
  });
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/i);
  const filename = match?.[1] || `attachment-${attachmentId}`;
  return { blob, filename };
}

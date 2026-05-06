import { http } from "./http";

export async function getSocialOverview(token) {
  return http("/api/social/overview", { method: "GET", token });
}

export async function discoverUsers(token, query = "") {
  const encoded = encodeURIComponent(query || "");
  return http(`/api/social/discover?q=${encoded}`, { method: "GET", token });
}

export async function getPublicProfile(token, handle) {
  return http(`/api/social/users/${encodeURIComponent(handle)}`, { method: "GET", token });
}

export async function sendFriendRequest(token, targetUserId) {
  return http(`/api/social/requests/${targetUserId}`, { method: "POST", token });
}

export async function acceptFriendRequest(token, requestId) {
  return http(`/api/social/requests/${requestId}/accept`, { method: "POST", token });
}

export async function rejectFriendRequest(token, requestId) {
  return http(`/api/social/requests/${requestId}/reject`, { method: "POST", token });
}

export async function cancelFriendRequest(token, requestId) {
  return http(`/api/social/requests/${requestId}/cancel`, { method: "POST", token });
}

export async function removeFriend(token, targetUserId) {
  return http(`/api/social/friends/${targetUserId}`, { method: "DELETE", token });
}

export async function blockUser(token, targetUserId) {
  return http(`/api/social/blocks/${targetUserId}`, { method: "POST", token });
}

export async function unblockUser(token, targetUserId) {
  return http(`/api/social/blocks/${targetUserId}`, { method: "DELETE", token });
}

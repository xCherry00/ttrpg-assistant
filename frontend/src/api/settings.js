import { http } from "./http";

export async function getMyProfile(token) {
  return http("/api/user/me", {
    method: "GET",
    token,
  });
}

export async function updateDisplayName(token, displayName) {
  return http("/api/user/display-name", {
    method: "PATCH",
    token,
    body: { displayName },
  });
}

export async function changePassword(token, currentPassword, newPassword) {
  return http("/api/user/change-password", {
    method: "POST",
    token,
    body: { currentPassword, newPassword },
  });
}

export async function updateEmail(token, newEmail, currentPassword) {
  return http("/api/user/email", {
    method: "PATCH",
    token,
    body: { newEmail, currentPassword },
  });
}

export async function updateChatNickColor(token, chatNickColor) {
  return http("/api/user/chat-nick-color", {
    method: "PATCH",
    token,
    body: { chatNickColor },
  });
}

export async function deleteAccount(token, currentPassword) {
  return http("/api/user", {
    method: "DELETE",
    token,
    body: { currentPassword },
  });
}

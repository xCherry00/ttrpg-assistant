import { http } from "./http";

export function getNotifications(token) {
  return http("/api/notifications", { token });
}

export function markNotificationRead(token, id) {
  return http(`/api/notifications/${id}/read`, {
    method: "POST",
    token,
  });
}

export function markAllNotificationsRead(token) {
  return http("/api/notifications/read-all", {
    method: "POST",
    token,
  });
}

export function deleteNotification(token, id) {
  return http(`/api/notifications/${id}`, {
    method: "DELETE",
    token,
  });
}

export function clearNotifications(token) {
  return http("/api/notifications", {
    method: "DELETE",
    token,
  });
}

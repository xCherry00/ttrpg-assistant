import { http } from "./http";

export function getNotifications(token) {
  return http("/api/notifications", { token });
}

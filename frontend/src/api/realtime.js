import { API_URL } from "./http";

export function createRealtimeEventSource(token) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  return new EventSource(`${API_URL}/api/realtime/events?${params.toString()}`);
}

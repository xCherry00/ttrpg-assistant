import { http } from "./http";

export function listCharacters(token) {
  return http("/api/characters", { method: "GET", token });
}

export function getCharacter(token, characterId) {
  return http(`/api/characters/${characterId}`, { method: "GET", token });
}

export function createCharacter(token, body) {
  return http("/api/characters", { method: "POST", token, body });
}

export function updateCharacter(token, characterId, body) {
  return http(`/api/characters/${characterId}`, { method: "PUT", token, body });
}

export function deleteCharacter(token, characterId) {
  return http(`/api/characters/${characterId}`, { method: "DELETE", token });
}

import { http, unwrapPage } from "./http";

export async function listCharacters(token) {
  return unwrapPage(await http("/api/characters", { method: "GET", token }));
}

export function getCharacter(token, characterId) {
  return http(`/api/characters/${characterId}`, { method: "GET", token });
}

export function deleteCharacter(token, characterId) {
  return http(`/api/characters/${characterId}`, { method: "DELETE", token });
}

export function getDndClasses(token) {
  return http("/api/compendium/dnd/classes", { method: "GET", token });
}

export function getDndRaces(token) {
  return http("/api/compendium/dnd/races", { method: "GET", token });
}

export function getDndBackgrounds(token) {
  return http("/api/compendium/dnd/backgrounds", { method: "GET", token });
}

export function quickCreateCharacter(token, body) {
  return http("/api/characters/dnd/quick-create", { method: "POST", token, body });
}

export function getCocOccupations(token) {
  return http("/api/compendium/coc7e/occupations", { method: "GET", token });
}

export function quickCreateCocCharacter(token, body) {
  return http("/api/characters/coc7e/quick-create", { method: "POST", token, body });
}

export function updateCharacterSheet(token, characterId, body) {
  return http(`/api/characters/${characterId}/sheet`, { method: "PUT", token, body });
}

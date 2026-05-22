import { http } from "./http";

export function searchDndMonsters(token, query) {
  const q = encodeURIComponent(query || "");
  return http(`/api/compendium/dnd5e/monsters?q=${q}`, { method: "GET", token });
}

export function getDndMonsterDetails(token, index) {
  return http(`/api/compendium/dnd5e/monsters/${index}`, { method: "GET", token });
}

export function getDndConditions(token) {
  return http("/api/compendium/dnd5e/conditions", { method: "GET", token });
}


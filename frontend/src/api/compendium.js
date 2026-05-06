import { http } from "./http";

export async function getCompendiumSystems(token) {
  return http("/api/compendium/systems", { token });
}

export async function getCompendiumCategories(token, systemCode) {
  return http(`/api/compendium/${encodeURIComponent(systemCode)}/categories`, { token });
}

export async function getCompendiumList(token, systemCode, category) {
  return http(`/api/compendium/${encodeURIComponent(systemCode)}/${encodeURIComponent(category)}`, { token });
}

export async function getCompendiumDetail(token, systemCode, category, index) {
  return http(`/api/compendium/${encodeURIComponent(systemCode)}/${encodeURIComponent(category)}/${encodeURIComponent(index)}`, { token });
}

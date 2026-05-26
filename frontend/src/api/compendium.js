import { http } from "./http";

function normalizeListPayload(payload, systemCode, category) {
  if (Array.isArray(payload)) {
    return {
      systemCode,
      category,
      count: payload.length,
      results: payload,
    };
  }
  return payload;
}

export async function getCompendiumSystems(token) {
  return http("/api/compendium/systems", { token });
}

export async function getCompendiumCategories(token, systemCode) {
  return http(`/api/compendium/${encodeURIComponent(systemCode)}/categories`, { token });
}

export async function getCompendiumList(token, systemCode, category) {
  const payload = await http(`/api/compendium/${encodeURIComponent(systemCode)}/${encodeURIComponent(category)}`, { token });
  return normalizeListPayload(payload, systemCode, category);
}

export async function getCompendiumDetail(token, systemCode, category, index) {
  if (systemCode === "dnd5e" && category === "conditions") {
    const listPayload = await getCompendiumList(token, systemCode, category);
    return listPayload.results.find((item) => item.index === index) || null;
  }
  return http(`/api/compendium/${encodeURIComponent(systemCode)}/${encodeURIComponent(category)}/${encodeURIComponent(index)}`, { token });
}

import { API_URL, http, unwrapPage } from "./http";

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

export async function downloadCharacterSheetPdf(token, characterId) {
  if (!characterId) {
    throw new Error("Brak ID postaci.");
  }
  const response = await fetch(`${API_URL}/api/characters/${characterId}/sheet.pdf`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("Nie znaleziono postaci.");
    if (response.status === 401) throw new Error("Sesja wygasla. Zaloguj sie ponownie.");
    throw new Error("Nie udalo sie pobrac PDF.");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `character-sheet-${characterId}.pdf`;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

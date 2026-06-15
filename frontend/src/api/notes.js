import { http } from "./http";

export function listNotes(token) {
  return http("/api/notes", { method: "GET", token });
}

export function createNote(token, payload) {
  return http("/api/notes", { method: "POST", token, body: payload });
}

export function updateNote(token, noteId, payload) {
  return http(`/api/notes/${noteId}`, { method: "PATCH", token, body: payload });
}

export function deleteNote(token, noteId) {
  return http(`/api/notes/${noteId}`, { method: "DELETE", token });
}

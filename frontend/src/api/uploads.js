import { API_URL } from "./http";

export async function uploadImage(token, file) {
  if (!file) throw new Error("Wybierz plik.");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/api/uploads/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = data?.message || data || "Nie udalo sie wgrac obrazu.";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

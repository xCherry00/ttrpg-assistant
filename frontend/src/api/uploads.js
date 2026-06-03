import { http } from "./http";

export async function uploadImage(token, file) {
  if (!file) throw new Error("Wybierz plik.");
  const form = new FormData();
  form.append("file", file);
  try {
    return await http("/api/uploads/images", {
      method: "POST",
      token,
      body: form,
    });
  } catch (err) {
    if (err?.rawMessage) {
      throw new Error(String(err.rawMessage));
    }
    throw err;
  }
}

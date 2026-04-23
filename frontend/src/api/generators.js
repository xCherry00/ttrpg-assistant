import { http } from "./http";

export async function getGeneratorPool(token, type, system) {
  const t = encodeURIComponent(type);
  const s = encodeURIComponent(system);
  return http(`/api/generators/pool?type=${t}&system=${s}`, {
    method: "GET",
    token,
  });
}

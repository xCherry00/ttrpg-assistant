import { http } from "./http";

export async function getGeneratorCatalog(token) {
  return http("/api/generators/catalog", {
    method: "GET",
    token,
  });
}

export async function getGeneratorDefinitions(token) {
  return http("/api/generators", {
    method: "GET",
    token,
  });
}

export async function getGeneratorVariants(token, generatorCode) {
  return http(`/api/generators/${encodeURIComponent(generatorCode)}/variants`, {
    method: "GET",
    token,
  });
}

export async function getGeneratorForm(token, generatorCode, variantCode) {
  return http(`/api/generators/${encodeURIComponent(generatorCode)}/${encodeURIComponent(variantCode)}/form`, {
    method: "GET",
    token,
  });
}

export async function getRecentGeneratorResults(token) {
  return http("/api/generator-results/recent", {
    method: "GET",
    token,
  });
}

export async function getGeneratorTemplates(token) {
  return http("/api/generator-templates", {
    method: "GET",
    token,
  });
}

export async function createGeneratorTemplate(token, template) {
  return http("/api/generator-templates", {
    method: "POST",
    token,
    body: template,
  });
}

export async function getGeneratorPool(token, type, system) {
  const t = encodeURIComponent(type);
  const s = encodeURIComponent(system);
  return http(`/api/generators/pool?type=${t}&system=${s}`, {
    method: "GET",
    token,
  });
}

export async function generateContent(token, system, type, params) {
  const s = encodeURIComponent(system);
  const t = encodeURIComponent(type);
  return http(`/api/generators/${s}/${t}/generate`, {
    method: "POST",
    token,
    body: { params },
  });
}

export async function generateVariantContent(token, generatorCode, variantCode, params, campaignId) {
  const g = encodeURIComponent(generatorCode);
  const v = encodeURIComponent(variantCode);
  return http(`/api/generators/${g}/${v}/generate`, {
    method: "POST",
    token,
    body: { campaignId, params },
  });
}

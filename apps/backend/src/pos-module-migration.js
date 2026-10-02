export const legacyPosModule = "POS";
export const canonicalPosModule = "NTT Data POS";

function mergeValues(current, incoming) {
  if (current == null || current === "") return incoming;
  if (incoming == null || incoming === "") return current;
  if (typeof current === "number" && typeof incoming === "number") return current + incoming;
  if (Array.isArray(current) && Array.isArray(incoming)) return [...new Set([...current, ...incoming])];
  if (typeof current === "object" && typeof incoming === "object" && !Array.isArray(current) && !Array.isArray(incoming)) {
    const result = { ...current };
    for (const [key, value] of Object.entries(incoming)) result[key] = key in result ? mergeValues(result[key], value) : value;
    return result;
  }
  return current;
}

export function replaceLegacyPosModule(value) {
  if (value === legacyPosModule) return canonicalPosModule;
  if (Array.isArray(value)) return value.map(replaceLegacyPosModule);
  if (!value || typeof value !== "object") return value;
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = rawKey === legacyPosModule ? canonicalPosModule : rawKey;
    const nextValue = replaceLegacyPosModule(rawValue);
    result[key] = key in result ? mergeValues(result[key], nextValue) : nextValue;
  }
  return result;
}

export function normalizePosModuleCatalog(catalog = []) {
  const normalized = replaceLegacyPosModule(catalog);
  const result = [];
  for (const item of normalized) {
    if (!item || typeof item !== "object") continue;
    if (item.module !== canonicalPosModule) {
      result.push(item);
      continue;
    }
    const existing = result.find(candidate => candidate?.module === canonicalPosModule);
    if (existing) Object.assign(existing, mergeValues(existing, item), { group: "NTT Own IP" });
    else result.push({ ...item, module: canonicalPosModule, group: "NTT Own IP" });
  }
  return result;
}

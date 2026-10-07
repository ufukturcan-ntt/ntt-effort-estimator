const identityHeaders = new Set([
  "Implementation Type", "Kaynak Tipi", "Kapsam Soru ID", "Kapsam Sorusu",
  "Geliştirme Soru ID", "Geliştirme Sorusu", "Modül", "Hedef Modül", "Efor Bazı", "Tarih"
]);

function numericEffort(value) {
  if (value == null || String(value).trim() === "") return null;
  const number = Number(String(value).trim().replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function mergeFvbVmpRows(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const headerIndex = rows.findIndex(row => Array.isArray(row) && row.includes("Kaynak Tipi") && row.includes("Hedef Modül"));
  if (headerIndex < 0) return rows;

  const headers = rows[headerIndex];
  const at = Object.fromEntries(headers.map((header, index) => [String(header || "").trim(), index]));
  const targetModules = new Set(["ABAP", "MM", "PP"]);
  const groups = new Map();

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    if (row[at["Geliştirme Soru ID"]] !== "dev-59"
      || !targetModules.has(row[at["Hedef Modül"]])
      || row[at["Kaynak Tipi"]] !== "Değişken"
      || row[at["Efor Bazı"]] !== "Sabit") return;
    const key = [row[at["Implementation Type"]], row[at["Geliştirme Soru ID"]], row[at["Hedef Modül"]], row[at["Efor Bazı"]]].join("::");
    const entries = groups.get(key) || [];
    entries.push({ index: headerIndex + 1 + offset, row });
    groups.set(key, entries);
  });

  const remove = new Set();
  for (const entries of groups.values()) {
    if (entries.length < 2) continue;
    const merged = [...entries[0].row];
    headers.forEach((header, index) => {
      if (identityHeaders.has(String(header || "").trim())) return;
      const values = entries.map(entry => numericEffort(entry.row[index])).filter(value => value != null);
      if (values.length) merged[index] = values.reduce((sum, value) => sum + value, 0);
    });
    rows[entries[0].index] = merged;
    entries.slice(1).forEach(entry => remove.add(entry.index));
  }

  return rows.filter((_row, index) => !remove.has(index));
}

export function correctFvbAbapCustomizingEffort(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const headerIndex = rows.findIndex(row => Array.isArray(row) && row.includes("Geliştirme Soru ID") && row.includes("Hedef Modül"));
  if (headerIndex < 0) return rows;
  const at = Object.fromEntries(rows[headerIndex].map((header, index) => [String(header || "").trim(), index]));
  rows.slice(headerIndex + 1).forEach(row => {
    const isFvb = row[at["Geliştirme Soru ID"]] === "dev-59"
      || row[at["Geliştirme Sorusu"]] === "Üretim ana veri yaratma otomasyonu (FVB)";
    if (isFvb && row[at["Hedef Modül"]] === "ABAP" && row[at["Efor Bazı"]] === "Sabit") {
      row[at.Uyarlama] = 15;
    }
  });
  return rows;
}

function removeMatrixReferences(matrix, idHeader) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const headerIndex = rows.findIndex(row => Array.isArray(row) && row.includes(idHeader));
  if (headerIndex < 0) return rows;
  const idIndex = rows[headerIndex].indexOf(idHeader);
  return rows.filter((row, index) => index <= headerIndex || row[idIndex] !== "scope-29");
}

export function removeObsoleteTeamSplitScopeQuestion(config) {
  const next = structuredClone(config || {});
  next.scopeQuestions = (next.scopeQuestions || []).filter(question => question?.id !== "scope-29");
  next.restrictions = removeMatrixReferences(next.restrictions, "Question ID");
  next.scopeSizeImpacts = removeMatrixReferences(next.scopeSizeImpacts, "Question ID");
  next.variableModulePhase = removeMatrixReferences(next.variableModulePhase, "Kapsam Soru ID");
  return next;
}

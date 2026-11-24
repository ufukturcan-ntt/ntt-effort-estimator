export const posCashRegisterRangeQuestions = [
  { id: "scope-110", no: 110, name: "Kasa sayısı 0-100 arasında mıdır?", score: 0.5 },
  { id: "scope-122", no: 122, name: "Kasa sayısı 101-600 arasında mıdır?", score: 0.3 },
  { id: "scope-123", no: 123, name: "Kasa sayısı 600ün üzerinde midir?", score: 0.1 }
];

const normalized = value => String(value || "").trim().toLocaleLowerCase("tr-TR");

function cloneMatrixRows(matrix, idHeader, nameHeader, sourceId, questions, mutate) {
  if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) return matrix;
  const headers = matrix[0].map(value => String(value || "").trim());
  const idIndex = headers.indexOf(idHeader);
  const nameIndex = headers.indexOf(nameHeader);
  if (idIndex < 0 || nameIndex < 0) return matrix;
  const questionIds = new Set(questions.map(item => item.id));
  const rows = matrix.slice(1).filter(Array.isArray).map(row => [...row]);
  const source = rows.find(row => String(row[idIndex] || "").trim() === sourceId);
  const retained = rows.filter(row => !questionIds.has(String(row[idIndex] || "").trim()));
  if (!source) return [headers, ...retained];
  const additions = questions.map(question => {
    const row = [...source];
    row[idIndex] = question.id;
    row[nameIndex] = question.name;
    mutate?.(row, headers, question);
    return row;
  });
  return [headers, ...retained, ...additions];
}

export function applyPosCashRegisterRangeMaintenance(config) {
  const next = structuredClone(config);
  const questions = Array.isArray(next.scopeQuestions) ? next.scopeQuestions : [];
  const oldIndex = questions.findIndex(item =>
    String(item?.id || "").trim() === "scope-110" || normalized(item?.name) === normalized("Kasa Sayısı")
  );
  const template = oldIndex >= 0 ? questions[oldIndex] : {};
  next.scopeQuestions = questions.filter(item => !posCashRegisterRangeQuestions.some(question => question.id === String(item?.id || "").trim()));
  posCashRegisterRangeQuestions.forEach(question => {
    next.scopeQuestions.push({
      ...template,
      id: question.id,
      no: question.no,
      name: question.name,
      description: question.name,
      category: template.category || "A. Organizasyon & Kapsam",
      group: template.group || "Kapsam",
      variableType: "Evet/Hayır",
      answerType: "yesno",
      sizeImpact: false,
      score: 0,
      active: true
    });
  });

  next.restrictions = cloneMatrixRows(
    next.restrictions, "Question ID", "Question", "scope-110", posCashRegisterRangeQuestions,
    (row, headers, question) => {
      const restrictionIdIndex = headers.indexOf("Restriction ID");
      const noIndex = headers.indexOf("No");
      if (restrictionIdIndex >= 0) row[restrictionIdIndex] = `restriction-${question.id}`;
      if (noIndex >= 0) row[noIndex] = question.no;
    }
  );
  next.scopeSizeImpacts = cloneMatrixRows(
    next.scopeSizeImpacts, "Question ID", "Kapsam Sorusu", "scope-110", posCashRegisterRangeQuestions,
    (row, headers, question) => {
      const scoreIndex = headers.indexOf("Puan");
      const coefficientIndex = headers.indexOf("Katsayı");
      const typeIndex = headers.indexOf("Size Etki Tipi");
      const noIndex = headers.indexOf("No");
      if (noIndex >= 0) row[noIndex] = question.no;
      if (scoreIndex >= 0) row[scoreIndex] = question.score;
      if (coefficientIndex >= 0) row[coefficientIndex] = 1;
      if (typeIndex >= 0) row[typeIndex] = "Sabit";
    }
  );
  next.variableModulePhase = cloneMatrixRows(
    next.variableModulePhase, "Kapsam Soru ID", "Kapsam Sorusu", "scope-110", posCashRegisterRangeQuestions,
    (row, headers, question) => {
      const noIndex = headers.indexOf("No");
      if (noIndex >= 0) row[noIndex] = question.no;
    }
  );
  return next;
}

export function migrateCashRegisterRangeAnswers(scopeAnswers = {}) {
  const next = { ...(scopeAnswers || {}) };
  const raw = next["scope-110"];
  if (raw == null || ["evet", "hayır", "hayir", "yes", "no"].includes(normalized(raw))) return next;
  const count = Number(raw);
  if (!Number.isFinite(count)) return next;
  next["scope-110"] = count >= 0 && count <= 100 ? "Evet" : "Hayır";
  next["scope-122"] = count >= 101 && count <= 600 ? "Evet" : "Hayır";
  next["scope-123"] = count > 600 ? "Evet" : "Hayır";
  return next;
}

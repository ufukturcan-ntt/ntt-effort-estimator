const normalize = value => String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

function idAllocator(prefix, questions) {
  const used = new Set(questions.map(item => String(item?.id || "").trim()).filter(Boolean));
  let next = Math.max(0, ...[...used].map(id => Number(id.match(new RegExp(`^${prefix}-(\\d+)$`))?.[1]) || 0));
  return () => {
    let candidate = "";
    do candidate = `${prefix}-${++next}`;
    while (used.has(candidate));
    used.add(candidate);
    return candidate;
  };
}

function matrixIndexes(matrix) {
  const headers = Array.isArray(matrix?.[0]) ? matrix[0].map(value => String(value || "").trim()) : [];
  return { headers, at: header => headers.indexOf(header) };
}

function rewriteMatrix(matrix, callback) {
  if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) return matrix;
  const { headers } = matrixIndexes(matrix);
  return [matrix[0], ...matrix.slice(1).filter(Array.isArray).map(source => {
    const row = [...source];
    callback(row, headers);
    return row;
  })];
}

function matchByIdAndName(mappings, id, name, requireName = false) {
  const normalizedName = normalize(name);
  return mappings.find(item => item.oldId === id && (!requireName || normalize(item.name) === normalizedName))
    || mappings.find(item => normalize(item.name) === normalizedName);
}

function repairQuestionDefinitions(scopeQuestions, developmentQuestions) {
  const nextScope = scopeQuestions.map(item => ({ ...item }));
  const nextDevelopment = developmentQuestions.map(item => ({ ...item }));
  const allocateScopeId = idAllocator("scope", nextScope);
  const allocateDevelopmentId = idAllocator("dev", nextDevelopment);
  const scopeMappings = [];
  const seenScopeIds = new Set();

  for (const item of nextScope) {
    const oldId = String(item.id || "").trim();
    if (oldId && !seenScopeIds.has(oldId)) {
      seenScopeIds.add(oldId);
      continue;
    }
    const newId = allocateScopeId();
    scopeMappings.push({ oldId, newId, name: item.name });
    item.id = newId;
    seenScopeIds.add(newId);
  }

  const developmentMappings = [];
  for (const item of nextDevelopment) {
    const oldId = String(item.id || "").trim();
    if (!oldId.startsWith("scope-")) continue;
    const newId = allocateDevelopmentId();
    developmentMappings.push({ oldId, newId, name: item.name });
    item.id = newId;
  }
  return { nextScope, nextDevelopment, scopeMappings, developmentMappings };
}

function rewriteRestrictionReferences(matrix, scopeMappings, developmentMappings) {
  return rewriteMatrix(matrix, (row, headers) => {
    const typeIndex = headers.indexOf("Variable Type");
    const idIndex = headers.indexOf("Question ID");
    const nameIndex = headers.indexOf("Question");
    if (typeIndex < 0 || idIndex < 0 || nameIndex < 0) return;
    const type = normalize(row[typeIndex]);
    const mappings = type.includes("geli") || type.includes("develop") ? developmentMappings : scopeMappings;
    const match = matchByIdAndName(mappings, String(row[idIndex] || "").trim(), row[nameIndex], mappings === scopeMappings);
    if (!match) return;
    row[idIndex] = match.newId;
    row[nameIndex] = match.name;
  });
}

function rewriteNamedReference(matrix, idHeader, nameHeader, mappings, requireName = false) {
  return rewriteMatrix(matrix, (row, headers) => {
    const idIndex = headers.indexOf(idHeader);
    const nameIndex = headers.indexOf(nameHeader);
    if (idIndex < 0 || nameIndex < 0) return;
    const match = matchByIdAndName(mappings, String(row[idIndex] || "").trim(), row[nameIndex], requireName);
    if (!match) return;
    row[idIndex] = match.newId;
    row[nameIndex] = match.name;
  });
}

function appendMissingRestrictions(matrix, scopeQuestions, developmentQuestions) {
  if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) return matrix;
  const rows = matrix.map(row => [...row]);
  const { headers, at } = matrixIndexes(rows);
  const indexes = {
    restrictionId: at("Restriction ID"), type: at("Variable Type"), questionId: at("Question ID"),
    question: at("Question"), industries: at("Allowed Industries"), implementations: at("Allowed Implementation Types"),
    systems: at("Allowed System Types"), active: at("Active?")
  };
  if (Object.values(indexes).some(index => index < 0)) throw new Error("Question Restrictions columns are incomplete");
  const existingKeys = new Set(rows.slice(1).map(row => `${normalize(row[indexes.type])}::${String(row[indexes.questionId] || "").trim()}`));
  const restrictionIds = new Set(rows.slice(1).map(row => String(row[indexes.restrictionId] || "").trim()).filter(Boolean));
  const definitions = [
    ...scopeQuestions.map(question => ({ type: "Kapsam", question })),
    ...developmentQuestions.map(question => ({ type: "Geliştirme", question }))
  ];
  let added = 0;
  for (const { type, question } of definitions) {
    const questionId = String(question?.id || "").trim();
    const key = `${normalize(type)}::${questionId}`;
    if (!questionId || existingKeys.has(key)) continue;
    const row = Array.from({ length: headers.length }, () => "");
    let restrictionId = `restriction-${questionId}`;
    for (let suffix = 2; restrictionIds.has(restrictionId); suffix += 1) restrictionId = `restriction-${questionId}-${suffix}`;
    row[indexes.restrictionId] = restrictionId;
    row[indexes.type] = type;
    row[indexes.questionId] = questionId;
    row[indexes.question] = question.name;
    row[indexes.industries] = "All";
    row[indexes.implementations] = "All";
    row[indexes.systems] = "All";
    row[indexes.active] = "No";
    rows.push(row);
    restrictionIds.add(restrictionId);
    existingKeys.add(key);
    added += 1;
  }
  return { rows, added };
}

export function repairQuestionIdentities(config) {
  if (!Array.isArray(config?.scopeQuestions) || !Array.isArray(config?.developmentQuestions) || !Array.isArray(config?.restrictions)) {
    throw new Error("Question identity repair data is incomplete");
  }
  const { nextScope, nextDevelopment, scopeMappings, developmentMappings } = repairQuestionDefinitions(
    config.scopeQuestions,
    config.developmentQuestions
  );
  let restrictions = rewriteRestrictionReferences(config.restrictions, scopeMappings, developmentMappings);
  let scopeSizeImpacts = rewriteNamedReference(config.scopeSizeImpacts, "Question ID", "Kapsam Sorusu", scopeMappings, true);
  let variableModulePhase = rewriteNamedReference(config.variableModulePhase, "Kapsam Soru ID", "Kapsam Sorusu", scopeMappings, true);
  variableModulePhase = rewriteNamedReference(variableModulePhase, "Geliştirme Soru ID", "Geliştirme Sorusu", developmentMappings);
  const appended = appendMissingRestrictions(restrictions, nextScope, nextDevelopment);
  restrictions = appended.rows;
  return {
    config: {
      ...config,
      scopeQuestions: nextScope,
      developmentQuestions: nextDevelopment,
      restrictions,
      scopeSizeImpacts,
      variableModulePhase
    },
    developmentIdMap: Object.fromEntries(developmentMappings.map(item => [item.oldId, item.newId])),
    stats: { scopeIdsRepaired: scopeMappings.length, developmentIdsRepaired: developmentMappings.length, restrictionsAdded: appended.added }
  };
}

export function remapDevelopmentAnswers(answers, idMap) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return answers;
  const next = { ...answers };
  for (const [oldId, newId] of Object.entries(idMap || {})) {
    if (!Object.prototype.hasOwnProperty.call(next, oldId)) continue;
    if (!Object.prototype.hasOwnProperty.call(next, newId)) next[newId] = next[oldId];
    delete next[oldId];
  }
  return next;
}

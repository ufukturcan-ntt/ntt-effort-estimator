export const allDevelopmentRestrictionTargets = [
  { legacyId: "dev-39", name: "LME Entegrasyonu ihtiyacı bulunmakta mıdır?" },
  { legacyId: "dev-40", name: "Toplam rapor sayısı" },
  { legacyId: "dev-41", name: "Toplam çıktı sayısı" }
];

const normalize = value => String(value || "").trim().toLocaleLowerCase("tr-TR");

export function upsertAllDevelopmentRestrictions(matrix, developmentQuestions = []) {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) return matrix;
  const rows = matrix.map(row => [...row]);
  const headers = rows[0].map(value => String(value || "").trim());
  const at = header => headers.indexOf(header);
  const indexes = {
    restrictionId: at("Restriction ID"),
    type: at("Variable Type"),
    questionId: at("Question ID"),
    question: at("Question"),
    industries: at("Allowed Industries"),
    implementations: at("Allowed Implementation Types"),
    systems: at("Allowed System Types"),
    active: at("Active?")
  };
  if (Object.values(indexes).some(index => index < 0)) throw new Error("Question Restrictions columns are incomplete");
  const questionsById = new Map(developmentQuestions.map(item => [String(item?.id || "").trim(), item]));
  const questionsByName = new Map(developmentQuestions.map(item => [normalize(item?.name), item]));
  for (const target of allDevelopmentRestrictionTargets) {
    const question = questionsById.get(target.legacyId) || questionsByName.get(normalize(target.name));
    if (!question?.id) throw new Error(`Development question is missing: ${target.name}`);
    const questionId = String(question.id).trim();
    const matches = rows.slice(1).map((row, index) => ({ row, index: index + 1 }))
      .filter(({ row }) => String(row[indexes.questionId] || "").trim() === questionId);
    const row = matches[0]?.row || Array.from({ length: headers.length }, () => "");
    if (!matches.length) rows.push(row);
    row[indexes.restrictionId] = row[indexes.restrictionId] || `restriction-${questionId}`;
    row[indexes.type] = "Geliştirme";
    row[indexes.questionId] = questionId;
    row[indexes.question] = question.name;
    row[indexes.industries] = "All";
    row[indexes.implementations] = "All";
    row[indexes.systems] = "All";
    row[indexes.active] = "Yes";
    for (const duplicate of matches.slice(1).reverse()) rows.splice(duplicate.index, 1);
  }
  return rows;
}

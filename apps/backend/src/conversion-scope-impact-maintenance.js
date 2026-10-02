const implementations = ["Brownfield Conversion", "Release Upgrade", "Data Migration", "Carve-out"];

export const conversionScopeImpactCorrections = [
  { question: "CVI / BP Dönüşümü", values: [20, 0, 10, 10], impactType: "Sabit" },
  { question: "Document Splitting Aktivasyonu", values: [15, 0, 5, 20], impactType: "Sabit" },
  { question: "Credit Management (FSCM)", values: [8, 5, 5, 5], impactType: "Sabit" },
  { question: "Simplification Item Etkisi", values: [0.4, 0.3, 0.1, 0.3], impactType: "Katsayı" },
  { question: "HCM → SuccessFactors / H4S4", values: [15, 10, 8, 15], impactType: "Sabit" }
];

function key(value = "") {
  return String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

export function applyConversionScopeImpactCorrections(matrix, scopeQuestions = []) {
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) return matrix;
  const headers = matrix[0].map(value => String(value || "").trim());
  const index = header => headers.indexOf(header);
  const noIndex = index("No");
  const idIndex = index("Question ID");
  const implementationIndex = index("Implementation Type");
  const systemIndex = index("System Type");
  const questionIndex = index("Kapsam Sorusu");
  const scoreIndex = index("Puan");
  const coefficientIndex = index("Katsayı");
  const impactTypeIndex = index("Size Etki Tipi");
  if ([idIndex, implementationIndex, systemIndex, questionIndex, scoreIndex, coefficientIndex, impactTypeIndex].some(value => value < 0)) {
    throw new Error("Scope size impact columns are incomplete");
  }

  const questionByName = new Map(scopeQuestions.map(item => [key(item?.name), item]));
  const correctionNames = new Set(conversionScopeImpactCorrections.map(item => key(item.question)));
  const correctionIds = new Set(conversionScopeImpactCorrections
    .map(item => String(questionByName.get(key(item.question))?.id || "").trim())
    .filter(Boolean));
  const rows = matrix.slice(1).filter(Array.isArray).map(row => [...row]).filter(row =>
    !correctionNames.has(key(row[questionIndex])) && !correctionIds.has(String(row[idIndex] || "").trim())
  );
  let nextNo = Math.max(0, ...rows.map(row => Number(row[noIndex]) || 0));

  for (const correction of conversionScopeImpactCorrections) {
    const question = questionByName.get(key(correction.question));
    if (!question?.id) throw new Error(`Scope question is missing: ${correction.question}`);
    implementations.forEach((implementation, position) => {
      const row = Array.from({ length: headers.length }, () => "");
      if (noIndex >= 0) row[noIndex] = ++nextNo;
      row[idIndex] = question.id;
      row[implementationIndex] = implementation;
      row[systemIndex] = "All";
      row[questionIndex] = question.name;
      row[scoreIndex] = correction.values[position];
      row[coefficientIndex] = 1;
      row[impactTypeIndex] = correction.impactType;
      rows.push(row);
    });
  }
  return [headers, ...rows];
}

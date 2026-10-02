export const carModules = [
  "CAR -POS Data Transfer and Audit (POSDTA)",
  "CAR -Multichannel Transaction Data Management",
  "CAR -Unified Demand Forecast (UDF)",
  "CAR -Demand Data Foundation (DDF)",
  "CAR -Omnichannel Promotion Pricing (OPP)",
  "CAR -Inventory Visibility and Omnichannel Article Availability and Sourcing (OAA)",
  "CAR -On-Shelf Availability (OSA)",
  "CAR -SAP Merchandise Planning",
  "CAR -SAP Assortment Planning",
  "CAR -SAP Allocation Management",
  "CAR -SAP Promotion Management"
];

export const carScopeQuestions = [
  ["scope-112", "Entegrasyon Sağlanacak ERP Sayısı", "CAR sistem ile entegrasyon hedeflenen ERP sistem sayısı", "Sayı", 5],
  ["scope-113", "CAR Modul Sayısı", "Kapsamda olacak CAR modul sayısı", "Sayı", 5],
  ["scope-114", "CAR Add-on Sayısı", "Kapsamda olacak CAR Add-on sayısı", "Sayı", 5],
  ["scope-109", "Mağaza Sayısı", "Kasa satış takibi yapılan mağaza sayısı", "Sayı", 5],
  ["scope-115", "E-Ticaret Entegrasyonu", "CAR sistem üzerinden e-ticaret ile entegrasyon var mı?", "Evet / Hayır", 10],
  ["scope-116", "Omnichannel Satış Operasyonu", "Mağazalarda omnichannel satış operasyonu var mı?", "Evet / Hayır", 10],
  ["scope-117", "Bayi Yönetimi", "Kasa satış takibi yapılan bayi var mı?", "Evet / Hayır", 5],
  ["scope-118", "Bayi Sayısı", "Kasa satış takibi yapılan bayi sayısı", "Sayı", 5],
  ["scope-119", "OPP Engine", "OPP Java engine kullanılacak mı?", "Evet / Hayır", 10],
  ["scope-120", "CAR Integration", "CAR sistem ile kasa ve e-ticaret harici hedeflenen farklı bir entegrasyon var mı?", "Evet / Hayır", 10],
  ["scope-121", "Stok Yönetimi", "Özelleştirilmiş stok hesaplama kuralı var mı?", "Evet / Hayır", 10]
];

export const carDevelopmentQuestion = {
  id: "dev-42",
  name: "Entegrasyon",
  description: "CAR sistemde kasa ve e-ticaret entegrasyonu haricinde 3rd party entegrasyon sayısı",
  variableType: "Sayı"
};

const phaseNames = ["Analiz", "Dokümantasyon", "Dokümantasyon Onay", "Uyarlama", "Birim Test", "QA Sistem Ayağa Kaldırma", "QA Anaveri Aktarım", "Internal Entegrasyon Testi", "Entegrasyon Testi", "Yetkilendirme", "Canlı Sistem Ayağa Kaldırma", "Canlı Anaveri Kontrol", "Canlı Anaveri Aktarım"];
const shortModuleNames = carModules.map(name => name.replace(/^CAR -/, ""));
const fixedValues = {
  SMALL: [
    [10,3,2,2,2,1,2,5,10,1,1,2,2],[10,3,2,2,2,3,2,5,6,1,2,2,2],[10,3,2,2,2,3,2,5,6,1,2,2,2],[10,2,2,2,1,1,1,5,5,1,2,2,2],[15,3,2,2,3,3,2,5,10,1,3,2,2],[10,3,2,2,2,2,2,5,10,1,2,2,2],[10,3,2,2,3,3,2,5,10,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[10,2,2,2,2,2,2,5,5,1,2,2,2]
  ],
  MEDIUM: [
    [15,3,2,3,3,2,2,5,15,1,2,2,2],[12,3,2,2,4,3,2,5,6,1,2,2,2],[12,3,2,2,4,3,2,5,6,1,2,2,2],[10,2,2,2,1,2,1,5,5,1,2,2,2],[15,3,2,2,3,3,2,5,10,1,3,2,2],[17,3,2,2,3,2,2,5,10,1,2,2,2],[15,3,2,2,3,3,2,5,10,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[10,2,2,2,3,3,2,5,5,1,2,2,2],[12,2,2,2,2,2,2,5,8,1,2,2,2]
  ],
  LARGE: [
    [15,3,2,4,3,3,2,5,15,1,3,3,2],[12,3,2,2,4,3,2,5,8,1,2,3,2],[12,3,2,2,4,3,2,5,8,1,2,3,2],[10,2,2,2,1,2,1,5,5,1,2,3,2],[17,3,2,2,3,3,2,5,12,1,3,3,2],[17,3,2,2,3,3,2,5,10,1,2,3,2],[15,3,2,2,3,3,2,5,10,1,2,3,2],[10,2,2,2,3,3,2,5,5,1,2,3,2],[10,2,2,2,3,3,2,5,5,1,2,3,2],[10,2,2,2,3,3,2,5,5,1,2,3,2],[15,2,2,2,3,2,2,5,10,1,2,3,2]
  ]
};
fixedValues["X-LARGE"] = fixedValues.LARGE.map(values => [...values]);

const restrictionQuestionNames = [
  ...carScopeQuestions.map(([, name]) => name),
  "Şirket Kodu", "Üretim Yeri", "Entegrasyon Testi Tekrar Sayısı",
  "Entegrasyon Testi Sayısı (Her ŞK/ÜY için ayrı mı)", "Birim Test Sayısı", "Validasyon",
  "Dokümantasyon Dili", "Sistem Dili", "Anahtar Kullanıcı Eğitimi olacak mı?",
  "Son Kullanıcı Eğitimi olacak mı? Olacak ise kaç farklı lokasyonda olacak? (Modül bazında)",
  "Süreç Dokümantasyonu yapılacak mı?", "Performans Testi", "Stres Testi", "Mağaza Testi", "Entegrasyon"
];

const normalize = value => String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
const headerIndexes = matrix => Object.fromEntries(matrix[0].map((header, index) => [String(header || "").trim(), index]));

function upsertQuestions(existing, definitions, group) {
  const result = Array.isArray(existing) ? existing.map(item => ({ ...item })) : [];
  for (const definition of definitions) {
    const [requestedId, name, description, variableType] = definition;
    let item = result.find(candidate => normalize(candidate.name) === normalize(name));
    if (!item) {
      item = { id: requestedId, name, description, group, active: true };
      result.push(item);
    }
    item.id = item.id || requestedId;
    if (!item.description) item.description = description;
    item.variableType = variableType;
    item.answerType = variableType === "Sayı" ? "number" : "yesno";
    item.group = group;
    item.active = true;
  }
  return result;
}

function upsertScopeImpacts(matrix, scopeQuestions) {
  const rows = matrix.map(row => [...row]);
  const at = headerIndexes(rows);
  let nextNo = Math.max(0, ...rows.slice(1).map(row => Number(row[at.No]) || 0));
  for (const [, name, , variableType, score] of carScopeQuestions) {
    const question = scopeQuestions.find(item => normalize(item.name) === normalize(name));
    const matches = rows.slice(1).map((row, index) => ({ row, index: index + 1 })).filter(({ row }) =>
      String(row[at["Question ID"]] || "") === question.id
      && normalize(row[at["Implementation Type"]]) === normalize("Greenfield")
      && normalize(row[at["System Type"]]) === normalize("All")
    );
    const target = matches[0]?.row || Array.from({ length: rows[0].length }, () => "");
    if (!matches.length) rows.push(target);
    target[at.No] = target[at.No] || ++nextNo;
    target[at["Question ID"]] = question.id;
    target[at["Implementation Type"]] = "Greenfield";
    target[at["System Type"]] = "All";
    target[at["Kapsam Sorusu"]] = question.name;
    target[at.Puan] = score;
    target[at.Katsayı] = 1;
    target[at["Size Etki Tipi"]] = variableType === "Sayı" ? "Katsayı" : "Sabit";
    for (const duplicate of matches.slice(1).reverse()) rows.splice(duplicate.index, 1);
  }
  return rows;
}

function upsertFixedDays(matrix) {
  const rows = matrix.map(row => [...row]);
  const at = headerIndexes(rows);
  for (const [size, sizeRows] of Object.entries(fixedValues)) {
    sizeRows.forEach((values, moduleIndex) => {
      const module = carModules[moduleIndex];
      let row = rows.slice(1).find(candidate => candidate[at.Modül] === module && candidate[at.Size] === size
        && candidate[at["Implementation Type"]] === "Greenfield" && candidate[at["System Type"]] === "SAP CAR");
      if (!row) {
        row = Array.from({ length: rows[0].length }, () => "");
        rows.push(row);
      }
      row[at.Modül] = module;
      row[at.Size] = size;
      phaseNames.forEach((phase, index) => row[at[phase]] = values[index]);
      row[at.Eğitim] = "";
      row[at["Implementation Type"]] = "Greenfield";
      row[at["System Type"]] = "SAP CAR";
    });
  }
  return rows;
}

function upsertRestrictions(matrix, scopeQuestions, developmentQuestions) {
  const rows = matrix.map(row => [...row]);
  const at = headerIndexes(rows);
  const allQuestions = [
    ...scopeQuestions.map(item => ({ ...item, restrictionType: "Kapsam" })),
    ...developmentQuestions.map(item => ({ ...item, restrictionType: "Geliştirme" }))
  ];
  const skipped = [];
  for (const name of restrictionQuestionNames) {
    const question = allQuestions.find(item => normalize(item.name) === normalize(name));
    if (!question) {
      skipped.push(name);
      continue;
    }
    let row = rows.slice(1).find(candidate => String(candidate[at["Question ID"]] || "") === question.id);
    if (!row) {
      row = Array.from({ length: rows[0].length }, () => "");
      rows.push(row);
    }
    row[at["Restriction ID"]] = row[at["Restriction ID"]] || `restriction-${question.id}`;
    row[at["Variable Type"]] = question.restrictionType;
    row[at["Question ID"]] = question.id;
    row[at.Question] = question.name;
    row[at["Allowed Industries"]] = "Perakende";
    row[at["Allowed Implementation Types"]] = "Greenfield";
    row[at["Allowed System Types"]] = "SAP CAR";
    row[at["Active?"]] = "Yes";
  }
  return { rows, skipped };
}

function ensureSapCarSystemType(matrix) {
  const rows = matrix.map(row => [...row]);
  const at = headerIndexes(rows);
  if (!rows.slice(1).some(row => row[at["System Type"]] === "SAP CAR")) {
    const row = Array.from({ length: rows[0].length }, () => "");
    row[at["System Type"]] = "SAP CAR";
    rows.push(row);
  }
  return rows;
}

export function applyCarMaintenance(config) {
  const next = structuredClone(config);
  next.moduleCatalog = [...(next.moduleCatalog || []).filter(item => !carModules.includes(item?.module)), ...carModules.map(module => ({ module, group: "Advanced Solution", selected: false, team: "" }))];
  next.projectDefinitions = ensureSapCarSystemType(next.projectDefinitions);
  next.scopeQuestions = upsertQuestions(next.scopeQuestions, carScopeQuestions, "Kapsam");
  next.developmentQuestions = upsertQuestions(next.developmentQuestions, [[carDevelopmentQuestion.id, carDevelopmentQuestion.name, carDevelopmentQuestion.description, carDevelopmentQuestion.variableType]], "Geliştirme");
  next.scopeSizeImpacts = upsertScopeImpacts(next.scopeSizeImpacts, next.scopeQuestions);
  next.fixedDays = upsertFixedDays(next.fixedDays);
  const restrictions = upsertRestrictions(next.restrictions, next.scopeQuestions, next.developmentQuestions);
  next.restrictions = restrictions.rows;
  return { config: next, skipped: restrictions.skipped };
}

export { fixedValues, phaseNames, restrictionQuestionNames, shortModuleNames };

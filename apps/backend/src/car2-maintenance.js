import { fixedDaysModuleEfforts, fixedDaysModuleNames, fixedDaysModulePhases } from "./fixed-days-module-data.js";

const scopeDefinitions = [
  ["Farklı Şirket Yapısı", "Benzer işi-süreci olan şirketler göz önüne alındığında kaç farklı yapıda şirket bulunmaktadır.", "Sayı", 5],
  ["Satış Kanalları", "Web, Pazaryeri, Mağaza vb. gibi farklı satış kanalları.", "Sayı", 5],
  ["Dağıtım Merkezi/ Mağaza Sayısı", "Kaç farklı dağıtım merkezi/ mağaza bulunmaktadır?", "Sayı", 5],
  ["Franchise Mağaza Sayısı", "Franchise mağazaları sistemde takip edilecek mi?", "Sayı", 2],
  ["Üretim Var mı", "Üretim var mı?", "Evet / Hayır", 15],
  ["Omnichannel Satış/ İade", "Omnichannel satış/ iade süreçleri var mı?", "Evet / Hayır", 5],
  ["Perakende Müşteri Takibi", "Bireysel (B2C) müşteriler kimlik/kart bazında sistemde tanımlı ve takip edilecek mi?", "Evet / Hayır", 3],
  ["Loyalty (Sadakat Programı)", "Puan biriktirme/kullanma bazlı sadakat programı olacak mı?", "Evet / Hayır", 3],
  ["Gift Card Yönetimi", "Hediye çeki/kart satışı, bakiye takibi ve kullanımı olacak mı?", "Evet / Hayır", 2],
  ["Kampanya Yönetimi", "Kaç farklı kampanya/promosyon tipi (indirim, N al M öde, bundle vb.) yönetilecek?", "Sayı", 5],
  ["CRM Entegrasyonu", "CRM entegrasyonu var mı?", "Evet / Hayır", 3],
  ["E-Commerce Entegrasyonu", "E-Commerce entegrasyonu var mı?", "Evet / Hayır", 5],
  ["Marketplace Entegrasyonu", "Marketplace entegrasyonu var mı?", "Evet / Hayır", 4],
  ["S4/ OMS", "Stoğun çıkacağı kaynağı belirleme ve alokasyon yapma", "Evet / Hayır", 5],
  ["OMS Entegrasyonu", "OMS entegrasyonu", "Evet / Hayır", 2],
  ["WMS Entegrasyonu", "3rd party depo entegrasyonu var mı?", "Evet / Hayır", 5],
  ["EWM Advanced", "Advanced EWM özelliklerinin kullanım ihtiyacı var mıdır?", "Evet / Hayır", 5],
  ["Replenishment Entegrasyonu", "3rd party ihtiyaç hesaplama programı kullanılıyor mu? (Invent, Solvoyo vb.)", "Evet / Hayır", 3],
  ["Kasa Entegrasyonu", "Kasa entegrasyonu var mı?", "Evet / Hayır", 5],
  ["S4/ POS", "S4 üzerinde POS kullanılacak mı?", "Evet / Hayır", 5],
  ["PLM Entegrasyonu", "PLM sistemi kullanılıyor mu, SAP ile entegre edilecek mi?", "Evet / Hayır", 5],
  ["Tedarikçi Portali", "Tedarikçi portali kullanılıyor mu?", "Evet / Hayır", 3],
  ["SSH Entegrasyonu", "Satış sonrası hizmetler için entegrasyon var mı?", "Evet / Hayır", 2],
  ["S4/ SSH", "Satış sonrası hizmetler SAP'de mi yürütülecek?", "Evet / Hayır", 4],
  ["B2B Entegrasyonu", "B2B entegrasyonu var mı?", "Evet / Hayır", 5],
  ["Kurumsal Portal Entegrasyonu", "Kurumsal Portal entegrasyonu var mı?", "Evet / Hayır", 5],
  ["Hesaplaşma Yönetimi", "Hesaplaşma Yönetimi var mı?", "Evet / Hayır", 2],
  ["Kredi Yönetimi", "Müşterilerde Kredi Yönetimi var mı?", "Evet / Hayır", 2],
  ["Satınalma Bütçe Yönetimi", "Miktar bazlı Bütçe Yönetimi var mı?", "Evet / Hayır", 5],
  ["Entegrasyon Sayısı", "Öngörülen third party entegrasyon sayısı nedir?", "Sayı", 3],
  ["3rd party MES Entegrasyonu", "Kaç farklı hatta farklı değişkenlerle MES entegrasyonu olacaktır", "Evet / Hayır", 15],
  ["Varyant Konfigürasyonu", "Varyant konfigürasyonu kullanım ihtiyacı var mıdır?", "Evet / Hayır", 20],
  ["Şirket Kodu", "Farklı şirket kodu sayısı", "Sayı"],
  ["Üretim Yeri", "Farklı üretim yeri sayısı", "Sayı"],
  ["Entegrasyon Testi Tekrar Sayısı", "Kapsamda bulunan şirket kodları ve üretim yerleri bazında 1 tekrar olacak şekilde entegrasyon testi çevrilecektir.", "Sayı"],
  ["Entegrasyon Testi Sayısı (Her ŞK/ÜY için ayrı mı)", "Kapsamda bulunan şirket kodları ve üretim yerleri bazında 1 kere entegrasyon testi çevrilecektir.", "Evet / Hayır"],
  ["Birim Test Sayısı", "Kapsamda bulunan şirket kodları ve üretim yerleri bazında 1 kere birim test eğitimi verilecektir.", "Sayı"],
  ["Validasyon", "Var? Yok?", "Evet / Hayır"],
  ["Dokümantasyon Dili", "Kaç farklı dilde dokümantasyon talebi bulunmakta?", "Sayı"],
  ["Sistem Dili", "Uyarlaması gereken dil sayısı", "Sayı"],
  ["Anahtar Kullanıcı Eğitimi olacak mı?", "Anahtar kullanıcı eğitimi proje ekibi tarafından verilecek mi?", "Evet / Hayır"],
  ["Son Kullanıcı Eğitimi olacak mı? Olacak ise kaç farklı lokasyonda olacak? (Modül bazında)", "Son kullanıcı eğitimi proje ekibi tarafından verilecek mi?", "Sayı"],
  ["Süreç Dokümantasyonu yapılacak mı?", "İhtiyacı bulunmakta mıdır?", "Evet / Hayır"],
  ["Performans Testi", "Testler kapsamında performans testi yapılacak mı?", "Evet / Hayır"],
  ["Stres Testi", "Testler kapsamında stres testi yapılacak mı?", "Evet / Hayır"],
  ["Saha Testi", "Testler kapsamında saha testi yapılacak mı?", "Evet / Hayır"],
  ["Kredi Yönetimi", "Kredi limit talebi, workflow kurgusu talep ediliyor mu?", "Evet / Hayır"],
  ["Intercompany", "Kaç şirket arasında olacak?", "Evet / Hayır"],
  ["Crosscompany", "Kaç şirket arasında olacak?", "Evet / Hayır"],
  ["Prim yönetimi", "Prim yönetimi nasıl takip ediliyor, kaç çeşit prim var (ciro, lojistik, komisyon, personel vb.)", "Sayı"],
  ["it.foreign trade", "Kapsam dahilinde midir?", "Evet / Hayır"],
  ["Onay Stratejileri", "İhtiyacı bulunmakta mıdır?", "Evet / Hayır"]
];

const developmentDefinitions = [
  ["Banka Entegrasyonu", "Giden ve gelen banka entegrasyonu için banka bazında verilen efor", "Sayı"],
  ["El terminali (giriş, nakil, çekme, mal çıkış)", "İhtiyacı bulunmakta mıdır?", "Sayı"],
  ["it.foreign trade & Gümrük ve diğer 3rd parti entegrasyonlar", "İhtiyacı bulunmakta mıdır?", "Evet / Hayır"]
];

const effortDefinitions = [
  ["Perakende Müşteri Takibi", "SD", "Sabit", 10], ["Loyalty (Sadakat Programı)", "SD", "Sabit", 15],
  ["Gift Card Yönetimi", "SD", "Sabit", 10], ["Kampanya Yönetimi", "SD", "Katsayı", 10],
  ["CRM Entegrasyonu", "SD", "Sabit", 10], ["E-Commerce Entegrasyonu", "SD", "Sabit", 40],
  ["Marketplace Entegrasyonu", "SD", "Sabit", 30], ["S4/ OMS", "SD", "Sabit", 20],
  ["OMS Entegrasyonu", "SD", "Sabit", 15], ["WMS Entegrasyonu", "SD", "Sabit", 40],
  ["Kasa Entegrasyonu", "SD", "Sabit", 40], ["PLM Entegrasyonu", "SD", "Sabit", 25],
  ["SSH Entegrasyonu", "SD", "Sabit", 20], ["S4/ SSH", "SD", "Sabit", 30],
  ["B2B Entegrasyonu", "SD", "Sabit", 40], ["Kurumsal Portal Entegrasyonu", "SD", "Sabit", 40],
  ["E-Commerce Entegrasyonu", "MM", "Sabit", 40], ["Marketplace Entegrasyonu", "MM", "Sabit", 30],
  ["S4/ OMS", "MM", "Sabit", 20], ["OMS Entegrasyonu", "MM", "Sabit", 15],
  ["WMS Entegrasyonu", "MM", "Sabit", 40], ["Replenishment Entegrasyonu", "MM", "Sabit", 30],
  ["Kasa Entegrasyonu", "MM", "Sabit", 40], ["PLM Entegrasyonu", "MM", "Sabit", 30],
  ["Tedarikçi Portali", "MM", "Sabit", 30], ["SSH Entegrasyonu", "MM", "Sabit", 30],
  ["S4/ SSH", "MM", "Sabit", 30], ["B2B Entegrasyonu", "MM", "Sabit", 40],
  ["Kurumsal Portal Entegrasyonu", "MM", "Sabit", 40], ["Satınalma Bütçe Yönetimi", "MM", "Sabit", 30],
  ["Küçük ölçekli entegrasyonlar", "SD", "Sabit", 10], ["Orta ölçekli entegrasyonlar", "SD", "Sabit", 15],
  ["Küçük ölçekli entegrasyonlar", "MM", "Sabit", 10], ["Orta ölçekli entegrasyonlar", "MM", "Sabit", 15]
];

const retailPrivateCloudFixedDays = {
  SMALL: [82, 3, 1, 2, 2, 2, 3, 11, 14, 1, 2, 6, 6, "", ""],
  MEDIUM: [104, 5, 2, 3, 3, 3, 4, 20, 30, 2, 4, 10, 12, "", ""],
  LARGE: [194, 8, 3, 5, 5, 4, 6, 25, 32, 3, 5, 13, 15, "", ""],
  "X-LARGE": [304, 10, 5, 8, 8, 3, 8, 30, 50, 3, 6, 15, 15, "", ""]
};

const retailPrivateCloudPhases = [
  "Analiz", "Dokümantasyon", "Dokümantasyon Onay", "Uyarlama", "Birim Test",
  "QA Sistem Ayağa Kaldırma", "QA Anaveri Aktarım", "Internal Entegrasyon Testi",
  "Entegrasyon Testi", "Yetkilendirme", "Canlı Sistem Ayağa Kaldırma",
  "Canlı Anaveri Kontrol", "Canlı Anaveri Aktarım", "Hypercare", "Canlı Destek"
];

const normalize = value => String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
const splitValues = value => String(value || "").split(",").map(item => item.trim()).filter(Boolean);
const unionValues = (current, additions) => [...new Set([...splitValues(current), ...additions])].join(", ");
const indexes = headers => Object.fromEntries(headers.map((header, index) => [String(header || "").trim(), index]));

function nextQuestionId(questions, prefix) {
  const maximum = Math.max(0, ...questions.map(item => Number(String(item.id || "").match(new RegExp(`^${prefix}-(\\d+)$`))?.[1]) || 0));
  return `${prefix}-${maximum + 1}`;
}

function upsertQuestions(existing, definitions, prefix, group) {
  const questions = structuredClone(existing || []);
  for (const [name, description, variableType] of definitions) {
    let question = questions.find(item => normalize(item.name) === normalize(name));
    if (!question) {
      question = { id: nextQuestionId(questions, prefix), name, description, group, active: true };
      questions.push(question);
    }
    question.id ||= nextQuestionId(questions, prefix);
    question.description ||= description;
    question.variableType = variableType;
    question.answerType = variableType === "Sayı" ? "number" : "yesno";
    question.group = group;
    question.active = true;
  }
  return questions;
}

function upsertScopeImpacts(matrix, scopeQuestions) {
  const rows = structuredClone(matrix || []);
  const at = indexes(rows[0] || []);
  let nextNo = Math.max(0, ...rows.slice(1).map(row => Number(row[at.No]) || 0));
  for (const [name, , variableType, score] of scopeDefinitions.filter(item => item[3] != null)) {
    const question = scopeQuestions.find(item => normalize(item.name) === normalize(name));
    if (!question) continue;
    let row = rows.slice(1).find(candidate => candidate[at["Question ID"]] === question.id && candidate[at["Implementation Type"]] === "Greenfield");
    if (!row) {
      row = Array(rows[0].length).fill("");
      rows.push(row);
    }
    row[at.No] ||= ++nextNo;
    row[at["Question ID"]] = question.id;
    row[at["Implementation Type"]] = "Greenfield";
    row[at["System Type"]] = "SAP ECC, SAP S/4HANA Private Cloud, SAP S/4HANA Public Cloud, SAP S/4HANA On-Premise";
    row[at["Kapsam Sorusu"]] = question.name;
    row[at.Puan] = score;
    row[at.Katsayı] = 1;
    row[at["Size Etki Tipi"]] = variableType === "Sayı" ? "Katsayı" : "Sabit";
  }
  return rows;
}

function upsertRestrictions(matrix, scopeQuestions, developmentQuestions) {
  const rows = structuredClone(matrix || []);
  const at = indexes(rows[0] || []);
  const questions = [
    ...scopeDefinitions.map(([name]) => ({ ...(scopeQuestions.find(item => normalize(item.name) === normalize(name)) || {}), type: "Kapsam" })),
    ...developmentDefinitions.map(([name]) => ({ ...(developmentQuestions.find(item => normalize(item.name) === normalize(name)) || {}), type: "Geliştirme" }))
  ].filter(item => item.id);
  for (const question of questions) {
    let row = rows.slice(1).find(candidate => candidate[at["Question ID"]] === question.id);
    if (!row) {
      row = Array(rows[0].length).fill("");
      rows.push(row);
    }
    row[at["Restriction ID"]] ||= `restriction-${question.id}`;
    row[at["Variable Type"]] = question.type;
    row[at["Question ID"]] = question.id;
    row[at.Question] = question.name;
    row[at["Allowed Industries"]] = unionValues(row[at["Allowed Industries"]], ["Perakende"]);
    row[at["Allowed Implementation Types"]] = unionValues(row[at["Allowed Implementation Types"]], ["Greenfield"]);
    row[at["Allowed System Types"]] = unionValues(row[at["Allowed System Types"]], ["SAP ECC", "SAP S/4HANA Private Cloud", "SAP S/4HANA Public Cloud", "SAP S/4HANA On-Premise"]);
    row[at["Active?"]] = "Yes";
  }
  return rows;
}

function upsertEfforts(matrix, scopeQuestions, developmentQuestions) {
  const rows = structuredClone(matrix || []);
  const at = indexes(rows[0] || []);
  for (const [name, module, basis, analysis] of effortDefinitions) {
    const scope = scopeQuestions.find(item => normalize(item.name) === normalize(name));
    const development = developmentQuestions.find(item => normalize(item.name) === normalize(name));
    const question = scope || development;
    if (!question) continue;
    const type = scope ? "scope" : "development";
    const idHeader = type === "scope" ? "Kapsam Soru ID" : "Geliştirme Soru ID";
    const nameHeader = type === "scope" ? "Kapsam Sorusu" : "Geliştirme Sorusu";
    let row = rows.slice(1).find(candidate => candidate[at[idHeader]] === question.id && candidate[at["Hedef Modül"]] === module && candidate[at["Implementation Type"]] === "Greenfield");
    if (!row) {
      row = Array(rows[0].length).fill("");
      rows.push(row);
    }
    row.fill("");
    row[at["Implementation Type"]] = "Greenfield";
    row[at["Kaynak Tipi"]] = "Değişken";
    row[at[idHeader]] = question.id;
    row[at[nameHeader]] = question.name;
    row[at["Hedef Modül"]] = module;
    row[at["Efor Bazı"]] = basis;
    row[at.Analiz] = analysis;
  }
  return rows;
}

function addIndustryToFixedDays(matrix, projectDefinitions) {
  const source = structuredClone(matrix || []);
  if (!source.length) return source;
  const oldHeaders = source[0];
  const headers = oldHeaders.includes("Endüstri") ? [...oldHeaders] : ["Endüstri", ...oldHeaders];
  const industries = [...new Set((projectDefinitions || []).slice(1).map(row => String(row[0] || "").trim()).filter(Boolean))];
  const oldAt = indexes(oldHeaders);
  const newAt = indexes(headers);
  const normalizedRows = source.slice(1).map(row => headers.map(header => header === "Endüstri" ? "" : row[oldAt[header]] ?? ""));
  const result = [];
  for (const row of normalizedRows) {
    const currentIndustry = String(row[newAt.Endüstri] || "").trim();
    if (currentIndustry && currentIndustry !== "All") {
      result.push(row);
      continue;
    }
    for (const industry of industries) {
      const copy = [...row];
      copy[newAt.Endüstri] = industry;
      result.push(copy);
    }
  }
  const unique = new Map();
  for (const row of result) {
    const key = [row[newAt.Endüstri], row[newAt.Modül], row[newAt.Size], row[newAt["Implementation Type"]], row[newAt["System Type"]]].join("::");
    unique.set(key, row);
  }
  return [headers, ...unique.values()];
}

export function applyRetailPrivateCloudFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  for (const [size, values] of Object.entries(retailPrivateCloudFixedDays)) {
    for (const module of ["MM", "SD"]) {
      let row = rows.slice(1).find(candidate =>
        candidate[at.Endüstri] === "Perakende"
        && candidate[at.Modül] === module
        && candidate[at.Size] === size
        && candidate[at["Implementation Type"]] === "Greenfield"
        && candidate[at["System Type"]] === "SAP S/4HANA Private Cloud"
      );
      if (!row) {
        row = Array(rows[0].length).fill("");
        rows.push(row);
      }
      row[at.Endüstri] = "Perakende";
      row[at.Modül] = module;
      row[at.Size] = size;
      row[at["Implementation Type"]] = "Greenfield";
      row[at["System Type"]] = "SAP S/4HANA Private Cloud";
      retailPrivateCloudPhases.forEach((phase, index) => {
        if (at[phase] != null) row[at[phase]] = values[index];
      });
    }
  }
  return rows;
}

const obsoleteLargeGreenfieldIndustries = new Set([
  "Demir & Çelik", "FMCG", "Hizmet", "İlaç", "Kimya", "Konfeksiyon", "Metal", "Otomotiv"
]);
const obsoleteSapCarModules = new Set([
  "CAR -Demand Data Foundation (DDF)",
  "CAR -Inventory Visibility and Omnichannel Article Availability and Sourcing (OAA)",
  "CAR -Multichannel Transaction Data Management",
  "CAR -Omnichannel Promotion Pricing (OPP)",
  "CAR -On-Shelf Availability (OSA)",
  "CAR -POS Data Transfer and Audit (POSDTA)",
  "CAR -SAP Allocation Management",
  "CAR -SAP Assortment Planning",
  "CAR -SAP Merchandise Planning",
  "CAR -SAP Promotion Management",
  "CAR -Unified Demand Forecast (UDF)"
]);

export function removeObsoleteLargeGreenfieldCarFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => {
      const sharedKey = obsoleteLargeGreenfieldIndustries.has(String(row[at.Endüstri] || "").trim())
        && String(row[at.Size] || "").trim() === "LARGE"
        && String(row[at["Implementation Type"]] || "").trim() === "Greenfield";
      if (!sharedKey) return true;
      const systemType = String(row[at["System Type"]] || "").trim();
      const module = String(row[at.Modül] || "").trim();
      if (systemType === "NTT POS on S4" && module === "NTT Data POS") return false;
      return !(systemType === "SAP CAR" && obsoleteSapCarModules.has(module));
    })
  ];
}

const obsoleteForeignTradeIndustries = new Set([
  "Demir & Çelik", "FMCG", "Hizmet", "İlaç", "Kimya", "Konfeksiyon", "Metal", "Otomotiv", "Perakende"
]);
const obsoleteForeignTradeSizes = new Set(["SMALL", "MEDIUM", "LARGE", "X-LARGE"]);

export function removeObsoleteForeignTradeFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => !(
      obsoleteForeignTradeIndustries.has(String(row[at.Endüstri] || "").trim())
      && obsoleteForeignTradeSizes.has(String(row[at.Size] || "").trim())
      && String(row[at["Implementation Type"]] || "").trim() === "Greenfield"
      && String(row[at["System Type"]] || "").trim() === "SAP S/4HANA Private Cloud"
      && String(row[at.Modül] || "").trim() === "Dış Ticaret Çözümü"
    ))
  ];
}

const documentCarCleanupSizes = new Set(["SMALL", "MEDIUM", "X-LARGE"]);
const glasswingPrivateCloudEfforts = {
  SMALL: [15, 2, 1, 3, 3, 0, 1, 0, 8, 10, 0, 4, 1, 2, 3],
  MEDIUM: [20, 3, 1, 5, 4, 0, 1, 0, 10, 12, 0, 5, 1, 3, 4],
  LARGE: [24, 4, 1, 7, 5, 0, 1, 0, 12, 15, 0, 6, 1, 4, 5],
  "X-LARGE": [30, 6, 1, 9, 7, 0, 1, 0, 15, 20, 0, 6, 1, 6, 8]
};
const glasswingPrivateCloudPhases = [
  "Analiz", "Dokümantasyon", "Dokümantasyon Onay", "Uyarlama", "Birim Test", "Geliştirme",
  "QA Sistem Ayağa Kaldırma", "QA Anaveri Aktarım", "Internal Entegrasyon Testi", "Entegrasyon Testi",
  "Eğitim", "Yetkilendirme", "Canlı Sistem Ayağa Kaldırma", "Canlı Anaveri Kontrol", "Canlı Anaveri Aktarım"
];

const requestedModuleFixedDays = {
  SMALL: {
    "E-Fatura/Arşiv": [3, 1, 0, 1, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-İrsaliye": [3, 1, 0, 1, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-Defter": [2, 1, 0, 1, 2, 0, 1, 1, 0, 0, 0, 0, 2, 1, 0],
    "E-Hesap Özeti": [4, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 1, 1, 0],
    "E-Ödeme": [4, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 1, 1, 0],
    "E-Mutabakat": [2, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 1, 1, 0],
    "E-Beyanname": [4, 2, 0, 4, 3, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0],
    "Gelen Fatura Otomasyon": [4, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 1, 1, 0],
    COMMODITY: [42, 6, 2, 5, 6, 0, 2, 1, 12, 2, 0, 0, 2, 3, 5]
  },
  MEDIUM: {
    "E-Fatura/Arşiv": [4, 1, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-İrsaliye": [4, 1, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-Defter": [3, 1, 0, 2, 2, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0],
    "E-Hesap Özeti": [5, 1, 0, 4, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Ödeme": [5, 1, 0, 4, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Mutabakat": [4, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Beyanname": [5, 2, 0, 5, 3, 0, 1, 0, 0, 0, 0, 0, 4, 1, 0],
    "Gelen Fatura Otomasyon": [5, 1, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    COMMODITY: [65, 7, 2, 8, 7, 0, 2, 1, 20, 3, 0, 0, 2, 4, 9]
  },
  LARGE: {
    "E-Fatura/Arşiv": [5, 1, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-İrsaliye": [5, 1, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-Defter": [3, 1, 0, 3, 3, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0],
    "E-Hesap Özeti": [5, 2, 0, 4, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Ödeme": [5, 2, 0, 4, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Mutabakat": [5, 2, 0, 3, 3, 0, 1, 0, 2, 0, 0, 0, 2, 1, 0],
    "E-Beyanname": [6, 3, 0, 6, 3, 0, 2, 0, 0, 0, 0, 0, 3, 1, 0],
    "Gelen Fatura Otomasyon": [5, 2, 0, 3, 4, 0, 2, 0, 2, 0, 0, 0, 2, 1, 0],
    COMMODITY: [80, 9, 3, 10, 12, 0, 2, 1, 25, 6, 0, 0, 2, 5, 10]
  },
  "X-LARGE": {
    "E-Fatura/Arşiv": [5, 2, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-İrsaliye": [5, 2, 0, 2, 2, 0, 1, 1, 3, 0, 0, 0, 1, 1, 0],
    "E-Defter": [3, 2, 0, 3, 3, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0],
    "E-Hesap Özeti": [5, 3, 0, 4, 3, 0, 1, 0, 3, 0, 0, 0, 2, 1, 0],
    "E-Ödeme": [5, 3, 0, 4, 3, 0, 1, 0, 3, 0, 0, 0, 2, 1, 0],
    "E-Mutabakat": [5, 3, 0, 3, 3, 0, 1, 0, 3, 0, 0, 0, 2, 1, 0],
    "E-Beyanname": [6, 3, 0, 6, 3, 0, 2, 0, 0, 0, 0, 0, 4, 2, 0],
    "Gelen Fatura Otomasyon": [5, 2, 0, 3, 4, 0, 2, 0, 2, 0, 0, 0, 4, 1, 0],
    COMMODITY: [100, 9, 3, 15, 15, 0, 2, 1, 30, 10, 0, 0, 2, 8, 15]
  }
};

export function applyRequestedModuleFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  for (const row of rows.slice(1)) {
    if (String(row[at["Implementation Type"]] || "").trim() !== "Greenfield") continue;
    const size = String(row[at.Size] || "").trim().toUpperCase();
    const module = String(row[at.Modül] || "").trim();
    const values = requestedModuleFixedDays[size]?.[module];
    if (!values) continue;
    glasswingPrivateCloudPhases.forEach((phase, index) => {
      if (at[phase] != null) row[at[phase]] = values[index];
    });
  }
  return rows;
}

export function replaceGreenfieldFixedDayModules(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  const industries = [...new Set(rows.slice(1).map(row => String(row[at.Endüstri] || "").trim()).filter(Boolean))];
  const systems = ["SAP S/4HANA Private Cloud", "SAP ECC", "SAP S/4HANA On-Premise"];
  const greenfield = "Greenfield";
  const glasswing = "GLASSWING";
  const sourceGlasswing = new Map();
  for (const row of rows.slice(1)) {
    if (row[at["Implementation Type"]] !== greenfield || row[at["System Type"]] !== systems[0]
      || String(row[at.Modül] || "").trim().toUpperCase() !== glasswing) continue;
    sourceGlasswing.set(`${row[at.Endüstri]}|${row[at.Size]}`, structuredClone(row));
  }
  for (const industry of industries) {
    for (const size of ["SMALL", "MEDIUM", "LARGE", "X-LARGE"]) {
      if (!sourceGlasswing.has(`${industry}|${size}`)) throw new Error(`Missing Private Cloud GLASSWING row: ${industry}/${size}`);
    }
  }

  const targets = new Set(fixedDaysModuleNames.map(name => name.toUpperCase()));
  targets.add(glasswing);
  const kept = rows.slice(1).filter(row => {
    const module = String(row[at.Modül] || "").trim().toUpperCase();
    if (row[at["Implementation Type"]] !== greenfield || !targets.has(module)) return true;
    const system = String(row[at["System Type"]] || "").trim();
    if (module === glasswing) return system === systems[0];
    return !systems.includes(system);
  });

  const additions = [];
  const addEffortRow = (industry, size, module, system, values) => {
    const row = Array(rows[0].length).fill("");
    row[at.Endüstri] = industry;
    row[at.Size] = size;
    row[at["Implementation Type"]] = greenfield;
    row[at["System Type"]] = system;
    row[at.Modül] = module;
    fixedDaysModulePhases.forEach((phase, index) => {
      if (at[phase] != null) row[at[phase]] = values[index];
    });
    additions.push(row);
  };

  for (const [module, size, ...values] of fixedDaysModuleEfforts) {
    for (const industry of industries) {
      for (const system of systems) addEffortRow(industry, size, module, system, values);
    }
  }
  for (const industry of industries) {
    for (const size of ["SMALL", "MEDIUM", "LARGE", "X-LARGE"]) {
      const source = sourceGlasswing.get(`${industry}|${size}`);
      const values = fixedDaysModulePhases.map(phase => source[at[phase]] ?? 0);
      for (const system of systems.slice(1)) addEffortRow(industry, size, glasswing, system, values);
    }
  }
  return [rows[0], ...kept, ...additions];
}

export function applyFixedDaysDocumentMaintenance(matrix) {
  const source = structuredClone(matrix || []);
  if (!source.length) return source;
  const at = indexes(source[0]);
  const rows = source.slice(1).filter(row => {
    const industry = String(row[at.Endüstri] || "").trim();
    const size = String(row[at.Size] || "").trim();
    const implementation = String(row[at["Implementation Type"]] || "").trim();
    const systemType = String(row[at["System Type"]] || "").trim();
    const module = String(row[at.Modül] || "").trim();
    if (!obsoleteLargeGreenfieldIndustries.has(industry)
      || !documentCarCleanupSizes.has(size)
      || implementation !== "Greenfield") return true;
    if (systemType === "NTT POS on S4" && module === "NTT Data POS") return false;
    return !(systemType === "SAP CAR" && obsoleteSapCarModules.has(module));
  });
  for (const industry of obsoleteForeignTradeIndustries) {
    for (const [size, values] of Object.entries(glasswingPrivateCloudEfforts)) {
      let row = rows.find(candidate =>
        String(candidate[at.Endüstri] || "").trim() === industry
        && String(candidate[at.Size] || "").trim() === size
        && String(candidate[at["Implementation Type"]] || "").trim() === "Greenfield"
        && String(candidate[at["System Type"]] || "").trim() === "SAP S/4HANA Private Cloud"
        && String(candidate[at.Modül] || "").trim() === "GLASSWING"
      );
      if (!row) {
        row = Array(source[0].length).fill("");
        rows.push(row);
      }
      row[at.Endüstri] = industry;
      row[at.Size] = size;
      row[at["Implementation Type"]] = "Greenfield";
      row[at["System Type"]] = "SAP S/4HANA Private Cloud";
      row[at.Modül] = "GLASSWING";
      glasswingPrivateCloudPhases.forEach((phase, index) => {
        if (at[phase] != null) row[at[phase]] = values[index];
      });
    }
  }
  return [source[0], ...rows];
}

export function applySmallPrivateCloudBasisZeroEfforts(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  for (const industry of obsoleteForeignTradeIndustries) {
    let row = rows.slice(1).find(candidate =>
      String(candidate[at.Endüstri] || "").trim() === industry
      && String(candidate[at.Size] || "").trim() === "SMALL"
      && String(candidate[at["Implementation Type"]] || "").trim() === "Greenfield"
      && String(candidate[at["System Type"]] || "").trim() === "SAP S/4HANA Private Cloud"
      && String(candidate[at.Modül] || "").trim() === "BASIS"
    );
    if (!row) {
      row = Array(rows[0].length).fill("");
      rows.push(row);
    }
    row[at.Endüstri] = industry;
    row[at.Size] = "SMALL";
    row[at["Implementation Type"]] = "Greenfield";
    row[at["System Type"]] = "SAP S/4HANA Private Cloud";
    row[at.Modül] = "BASIS";
    glasswingPrivateCloudPhases.forEach(phase => {
      if (at[phase] != null) row[at[phase]] = 0;
    });
  }
  return rows;
}

const obsoleteMediumPmoIndustries = new Set([
  "Demir & Çelik", "FMCG", "Hizmet", "İlaç", "Kimya", "Konfeksiyon", "Metal", "Otomotiv", "Perakende"
]);

export function removeObsoleteMediumPrivateCloudPmoFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => !(
      obsoleteMediumPmoIndustries.has(String(row[at.Endüstri] || "").trim())
      && String(row[at.Size] || "").trim() === "MEDIUM"
      && String(row[at["Implementation Type"]] || "").trim() === "Greenfield"
      && String(row[at["System Type"]] || "").trim() === "SAP S/4HANA Private Cloud"
      && String(row[at.Modül] || "").trim() === "PMO"
    ))
  ];
}

export function removeAllPmoAndAbapFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => !new Set(["PMO", "ABAP"]).has(String(row[at.Modül] || "").trim()))
  ];
}

export function keepGreenfieldNttDataPosOnlyForRetail(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => !(
      String(row[at["Implementation Type"]] || "").trim() === "Greenfield"
      && String(row[at.Modül] || "").trim() === "NTT Data POS"
      && String(row[at.Endüstri] || "").trim() !== "Perakende"
    ))
  ];
}

export function removeZeroEffortBasisFixedDays(matrix) {
  const rows = structuredClone(matrix || []);
  if (!rows.length) return rows;
  const at = indexes(rows[0]);
  return [
    rows[0],
    ...rows.slice(1).filter(row => {
      if (String(row[at.Modül] || "").trim() !== "BASIS") return true;
      return glasswingPrivateCloudPhases.some(phase => Number(row[at[phase]] || 0) !== 0);
    })
  ];
}

export function applyCar2Maintenance(config) {
  const next = structuredClone(config);
  next.scopeQuestions = upsertQuestions(next.scopeQuestions, scopeDefinitions, "scope", "Kapsam");
  next.developmentQuestions = upsertQuestions(next.developmentQuestions, developmentDefinitions, "dev", "Geliştirme");
  next.scopeSizeImpacts = upsertScopeImpacts(next.scopeSizeImpacts, next.scopeQuestions);
  next.restrictions = upsertRestrictions(next.restrictions, next.scopeQuestions, next.developmentQuestions);
  next.variableModulePhase = upsertEfforts(next.variableModulePhase, next.scopeQuestions, next.developmentQuestions);
  next.fixedDays = addIndustryToFixedDays(next.fixedDays, next.projectDefinitions);
  return next;
}

export { scopeDefinitions, developmentDefinitions, effortDefinitions };

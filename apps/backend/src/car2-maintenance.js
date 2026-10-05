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

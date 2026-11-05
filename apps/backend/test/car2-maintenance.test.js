import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { applyCar2Maintenance, applyFixedDaysDocumentMaintenance, applyRequestedModuleFixedDays, applyRetailPrivateCloudFixedDays, applySmallPrivateCloudBasisZeroEfforts, developmentDefinitions, effortDefinitions, removeAllPmoAndAbapFixedDays, removeObsoleteForeignTradeFixedDays, removeObsoleteLargeGreenfieldCarFixedDays, removeObsoleteMediumPrivateCloudPmoFixedDays, removeZeroEffortBasisFixedDays, scopeDefinitions } from "../src/car2-maintenance.js";

const context = { window: {} };
vm.runInNewContext(await fs.readFile(new URL("../../frontend/public/assets/questions.js", import.meta.url), "utf8"), context);
vm.runInNewContext(await fs.readFile(new URL("../../frontend/public/assets/admin-data.js", import.meta.url), "utf8"), context);
const seed = structuredClone(context.window.adminSeedData);
seed.scopeQuestions = structuredClone(context.window.scopeQuestions);
seed.developmentQuestions = structuredClone(context.window.developmentQuestions);

const result = applyCar2Maintenance(seed);
const rerun = applyCar2Maintenance(result);
const normalize = value => String(value || "").trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");

for (const [name] of scopeDefinitions) {
  assert.equal(result.scopeQuestions.filter(item => normalize(item.name) === normalize(name)).length, 1, `scope duplicate: ${name}`);
}
for (const [name] of developmentDefinitions) {
  assert.equal(result.developmentQuestions.filter(item => normalize(item.name) === normalize(name)).length, 1, `development duplicate: ${name}`);
}
assert.deepEqual(rerun, result, "maintenance must be idempotent");

const fixedHeaders = result.fixedDays[0];
assert.ok(fixedHeaders.includes("Endüstri"));
const fixedIndustryIndex = fixedHeaders.indexOf("Endüstri");
const industries = new Set(result.projectDefinitions.slice(1).map(row => row[0]).filter(Boolean));
assert.deepEqual(new Set(result.fixedDays.slice(1).map(row => row[fixedIndustryIndex])), industries);

const updatedFixedDays = applyRetailPrivateCloudFixedDays(result.fixedDays);
const fixedAt = Object.fromEntries(updatedFixedDays[0].map((header, index) => [header, index]));
const expectedAnalysis = { SMALL: 82, MEDIUM: 104, LARGE: 194, "X-LARGE": 304 };
for (const [size, analysis] of Object.entries(expectedAnalysis)) {
  for (const module of ["MM", "SD"]) {
    const row = updatedFixedDays.slice(1).find(item => item[fixedAt.Endüstri] === "Perakende"
      && item[fixedAt.Modül] === module && item[fixedAt.Size] === size
      && item[fixedAt["Implementation Type"]] === "Greenfield"
      && item[fixedAt["System Type"]] === "SAP S/4HANA Private Cloud");
    assert.ok(row, `missing fixed-day row: ${size}/${module}`);
    assert.equal(row[fixedAt.Analiz], analysis);
    if (fixedAt.Hypercare != null) assert.equal(row[fixedAt.Hypercare], "");
    if (fixedAt["Canlı Destek"] != null) assert.equal(row[fixedAt["Canlı Destek"]], "");
  }
}

const obsoleteIndustries = new Set(["Demir & Çelik", "FMCG", "Hizmet", "İlaç", "Kimya", "Konfeksiyon", "Metal", "Otomotiv"]);
const preservationRow = Array(updatedFixedDays[0].length).fill("");
preservationRow[fixedAt.Endüstri] = "Perakende";
preservationRow[fixedAt.Size] = "LARGE";
preservationRow[fixedAt["Implementation Type"]] = "Greenfield";
preservationRow[fixedAt["System Type"]] = "NTT POS on S4";
preservationRow[fixedAt.Modül] = "NTT Data POS";
const cleanedFixedDays = removeObsoleteLargeGreenfieldCarFixedDays([...updatedFixedDays, preservationRow]);
const cleanedAt = Object.fromEntries(cleanedFixedDays[0].map((header, index) => [header, index]));
const isObsoleteFixedDay = row => obsoleteIndustries.has(row[cleanedAt.Endüstri])
  && row[cleanedAt.Size] === "LARGE"
  && row[cleanedAt["Implementation Type"]] === "Greenfield"
  && ((row[cleanedAt["System Type"]] === "NTT POS on S4" && row[cleanedAt.Modül] === "NTT Data POS")
    || (row[cleanedAt["System Type"]] === "SAP CAR" && String(row[cleanedAt.Modül] || "").startsWith("CAR -")));
assert.equal(cleanedFixedDays.slice(1).filter(isObsoleteFixedDay).length, 0);
assert.deepEqual(removeObsoleteLargeGreenfieldCarFixedDays(cleanedFixedDays), cleanedFixedDays, "Fixed Days cleanup must be idempotent");
assert.ok(cleanedFixedDays.slice(1).some(row => row[cleanedAt.Endüstri] === "Perakende"
  && row[cleanedAt.Size] === "LARGE" && row[cleanedAt["Implementation Type"]] === "Greenfield"
  && row[cleanedAt["System Type"]] === "NTT POS on S4" && row[cleanedAt.Modül] === "NTT Data POS"));

const foreignTradeIndustries = new Set(["Demir & Çelik", "FMCG", "Hizmet", "İlaç", "Kimya", "Konfeksiyon", "Metal", "Otomotiv", "Perakende"]);
const foreignTradeSizes = new Set(["SMALL", "MEDIUM", "LARGE", "X-LARGE"]);
const cleanedForeignTrade = removeObsoleteForeignTradeFixedDays(updatedFixedDays);
const foreignTradeAt = Object.fromEntries(cleanedForeignTrade[0].map((header, index) => [header, index]));
const isObsoleteForeignTrade = row => foreignTradeIndustries.has(row[foreignTradeAt.Endüstri])
  && foreignTradeSizes.has(row[foreignTradeAt.Size])
  && row[foreignTradeAt["Implementation Type"]] === "Greenfield"
  && row[foreignTradeAt["System Type"]] === "SAP S/4HANA Private Cloud"
  && row[foreignTradeAt.Modül] === "Dış Ticaret Çözümü";
assert.equal(cleanedForeignTrade.slice(1).filter(isObsoleteForeignTrade).length, 0);
assert.deepEqual(removeObsoleteForeignTradeFixedDays(cleanedForeignTrade), cleanedForeignTrade, "Foreign Trade cleanup must be idempotent");

const maintainedDocumentRows = applyFixedDaysDocumentMaintenance(updatedFixedDays);
const documentAt = Object.fromEntries(maintainedDocumentRows[0].map((header, index) => [header, index]));
assert.equal(maintainedDocumentRows.slice(1).filter(row => obsoleteIndustries.has(row[documentAt.Endüstri])
  && new Set(["SMALL", "MEDIUM", "X-LARGE"]).has(row[documentAt.Size])
  && row[documentAt["Implementation Type"]] === "Greenfield"
  && ((row[documentAt["System Type"]] === "NTT POS on S4" && row[documentAt.Modül] === "NTT Data POS")
    || (row[documentAt["System Type"]] === "SAP CAR" && String(row[documentAt.Modül] || "").startsWith("CAR -")))).length, 0);
const glasswingRows = maintainedDocumentRows.slice(1).filter(row => foreignTradeIndustries.has(row[documentAt.Endüstri])
  && foreignTradeSizes.has(row[documentAt.Size])
  && row[documentAt["Implementation Type"]] === "Greenfield"
  && row[documentAt["System Type"]] === "SAP S/4HANA Private Cloud"
  && row[documentAt.Modül] === "GLASSWING");
assert.equal(glasswingRows.length, 36);
const glasswingSmall = glasswingRows.find(row => row[documentAt.Endüstri] === "Perakende" && row[documentAt.Size] === "SMALL");
assert.equal(glasswingSmall[documentAt.Analiz], 15);
assert.equal(glasswingSmall[documentAt["Internal Entegrasyon Testi"]], 8);
assert.equal(glasswingSmall[documentAt["Canlı Anaveri Aktarım"]], 3);
assert.deepEqual(applyFixedDaysDocumentMaintenance(maintainedDocumentRows), maintainedDocumentRows, "Document maintenance must be idempotent");

const basisZeroRows = applySmallPrivateCloudBasisZeroEfforts(maintainedDocumentRows);
const basisAt = Object.fromEntries(basisZeroRows[0].map((header, index) => [header, index]));
const maintainedBasisRows = basisZeroRows.slice(1).filter(row => foreignTradeIndustries.has(row[basisAt.Endüstri])
  && row[basisAt.Size] === "SMALL"
  && row[basisAt["Implementation Type"]] === "Greenfield"
  && row[basisAt["System Type"]] === "SAP S/4HANA Private Cloud"
  && row[basisAt.Modül] === "BASIS");
assert.equal(maintainedBasisRows.length, 9);
for (const row of maintainedBasisRows) {
  for (const phase of ["Analiz", "Dokümantasyon", "Dokümantasyon Onay", "Uyarlama", "Birim Test", "Geliştirme", "QA Sistem Ayağa Kaldırma", "QA Anaveri Aktarım", "Internal Entegrasyon Testi", "Entegrasyon Testi", "Eğitim", "Yetkilendirme", "Canlı Sistem Ayağa Kaldırma", "Canlı Anaveri Kontrol", "Canlı Anaveri Aktarım"]) {
    if (basisAt[phase] != null) assert.equal(row[basisAt[phase]], 0, `BASIS ${phase} must be zero`);
  }
}
assert.deepEqual(applySmallPrivateCloudBasisZeroEfforts(basisZeroRows), basisZeroRows, "BASIS zero maintenance must be idempotent");

const pmoTarget = Array(basisZeroRows[0].length).fill("");
pmoTarget[basisAt.Endüstri] = "FMCG";
pmoTarget[basisAt.Size] = "MEDIUM";
pmoTarget[basisAt["Implementation Type"]] = "Greenfield";
pmoTarget[basisAt["System Type"]] = "SAP S/4HANA Private Cloud";
pmoTarget[basisAt.Modül] = "PMO";
const pmoPreserved = [...pmoTarget];
pmoPreserved[basisAt.Endüstri] = "Konfeksiyon";
const pmoCleanedRows = removeObsoleteMediumPrivateCloudPmoFixedDays([...basisZeroRows, pmoTarget, pmoPreserved]);
assert.equal(pmoCleanedRows.slice(1).some(row => row[basisAt.Endüstri] === "FMCG"
  && row[basisAt.Size] === "MEDIUM" && row[basisAt["Implementation Type"]] === "Greenfield"
  && row[basisAt["System Type"]] === "SAP S/4HANA Private Cloud" && row[basisAt.Modül] === "PMO"), false);
assert.equal(pmoCleanedRows.slice(1).some(row => row[basisAt.Endüstri] === "Konfeksiyon"
  && row[basisAt.Size] === "MEDIUM" && row[basisAt["Implementation Type"]] === "Greenfield"
  && row[basisAt["System Type"]] === "SAP S/4HANA Private Cloud" && row[basisAt.Modül] === "PMO"), false);
assert.deepEqual(removeObsoleteMediumPrivateCloudPmoFixedDays(pmoCleanedRows), pmoCleanedRows, "PMO cleanup must be idempotent");

const withoutPmoAndAbap = removeAllPmoAndAbapFixedDays(basisZeroRows);
assert.equal(withoutPmoAndAbap.slice(1).some(row => ["PMO", "ABAP"].includes(String(row[basisAt.Modül] || "").trim())), false);
assert.ok(withoutPmoAndAbap.slice(1).some(row => String(row[basisAt.Modül] || "").trim() === "BASIS"));
assert.deepEqual(removeAllPmoAndAbapFixedDays(withoutPmoAndAbap), withoutPmoAndAbap, "PMO and ABAP cleanup must be idempotent");

const basisWithEffort = [...maintainedBasisRows[0]];
basisWithEffort[basisAt["Implementation Type"]] = "Data Migration";
basisWithEffort[basisAt.Yetkilendirme] = 3;
const withoutZeroBasis = removeZeroEffortBasisFixedDays([...basisZeroRows, basisWithEffort]);
assert.equal(withoutZeroBasis.slice(1).some(row => String(row[basisAt.Modül] || "").trim() === "BASIS"
  && !row[basisAt.Yetkilendirme]), false);
assert.ok(withoutZeroBasis.slice(1).some(row => String(row[basisAt.Modül] || "").trim() === "BASIS"
  && row[basisAt["Implementation Type"]] === "Data Migration" && row[basisAt.Yetkilendirme] === 3));
assert.deepEqual(removeZeroEffortBasisFixedDays(withoutZeroBasis), withoutZeroBasis, "zero BASIS cleanup must be idempotent");

const commodityTarget = Array(basisZeroRows[0].length).fill(99);
commodityTarget[basisAt.Endüstri] = "Perakende";
commodityTarget[basisAt.Size] = "X-LARGE";
commodityTarget[basisAt["Implementation Type"]] = "Greenfield";
commodityTarget[basisAt["System Type"]] = "SAP S/4HANA Private Cloud";
commodityTarget[basisAt.Modül] = "COMMODITY";
const requestedRows = applyRequestedModuleFixedDays([...basisZeroRows, commodityTarget]);
const maintainedCommodity = requestedRows.at(-1);
assert.equal(maintainedCommodity[basisAt.Analiz], 100);
assert.equal(maintainedCommodity[basisAt["Internal Entegrasyon Testi"]], 30);
assert.equal(maintainedCommodity[basisAt["Entegrasyon Testi"]], 10);
assert.equal(maintainedCommodity[basisAt.Eğitim], 0);
assert.equal(maintainedCommodity[basisAt.Yetkilendirme], 0);
assert.equal(maintainedCommodity[basisAt["Canlı Anaveri Aktarım"]], 15);
assert.deepEqual(applyRequestedModuleFixedDays(requestedRows), requestedRows, "requested Fixed Days maintenance must be idempotent");

const vmpHeaders = result.variableModulePhase.find(row => row.includes("Kaynak Tipi"));
const vmpAt = Object.fromEntries(vmpHeaders.map((header, index) => [header, index]));
const vmpRows = result.variableModulePhase.slice(result.variableModulePhase.indexOf(vmpHeaders) + 1);
for (const [name, module] of effortDefinitions) {
  const question = [...result.scopeQuestions, ...result.developmentQuestions].find(item => normalize(item.name) === normalize(name));
  if (!question) continue;
  assert.ok(vmpRows.some(row => row[vmpAt["Hedef Modül"]] === module && (row[vmpAt["Kapsam Soru ID"]] === question.id || row[vmpAt["Geliştirme Soru ID"]] === question.id)), `missing VMP: ${name}/${module}`);
}

console.log("car2 maintenance tests passed");

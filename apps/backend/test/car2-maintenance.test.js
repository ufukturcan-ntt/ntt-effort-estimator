import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { applyCar2Maintenance, developmentDefinitions, effortDefinitions, scopeDefinitions } from "../src/car2-maintenance.js";

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

const vmpHeaders = result.variableModulePhase.find(row => row.includes("Kaynak Tipi"));
const vmpAt = Object.fromEntries(vmpHeaders.map((header, index) => [header, index]));
const vmpRows = result.variableModulePhase.slice(result.variableModulePhase.indexOf(vmpHeaders) + 1);
for (const [name, module] of effortDefinitions) {
  const question = [...result.scopeQuestions, ...result.developmentQuestions].find(item => normalize(item.name) === normalize(name));
  if (!question) continue;
  assert.ok(vmpRows.some(row => row[vmpAt["Hedef Modül"]] === module && (row[vmpAt["Kapsam Soru ID"]] === question.id || row[vmpAt["Geliştirme Soru ID"]] === question.id)), `missing VMP: ${name}/${module}`);
}

console.log("car2 maintenance tests passed");

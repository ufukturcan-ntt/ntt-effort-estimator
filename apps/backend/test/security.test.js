import test from "node:test";
import assert from "node:assert/strict";
import { bearerToken, createAccessToken, validOfferStatus, verifyAccessToken } from "../src/auth.js";
import fs from "node:fs";
import vm from "node:vm";
import { retailRestrictionRollback } from "../src/restriction-rollback.js";
import { obsoletePosScopeQuestions, posDevelopmentQuestionMaintenance, posScopeQuestionMaintenance, vmpDevelopmentQuestionMaintenance } from "../src/scope-question-migrations.js";
import { applyPosGreenfieldEffortMaintenance, posGreenfieldEffortMaintenance } from "../src/pos-effort-maintenance.js";
import { applyConversionScopeImpactCorrections, conversionScopeImpactCorrections } from "../src/conversion-scope-impact-maintenance.js";
import { normalizePosModuleCatalog, replaceLegacyPosModule } from "../src/pos-module-migration.js";

test("signed access token verifies and expires", () => {
  const token = createAccessToken({ id: "user-1", is_admin: false }, "test-secret", 1_000);
  assert.equal(verifyAccessToken(token, "test-secret", 2_000)?.sub, "user-1");
  assert.equal(verifyAccessToken(token, "wrong-secret", 2_000), null);
  assert.equal(verifyAccessToken(token, "test-secret", 8 * 60 * 60 * 1000 + 2_000), null);
});

test("bearer token parser rejects non-bearer authorization", () => {
  assert.equal(bearerToken("Bearer abc"), "abc");
  assert.equal(bearerToken("Basic abc"), "");
});

test("offer statuses are constrained", () => {
  assert.equal(validOfferStatus("DRAFT"), true);
  assert.equal(validOfferStatus("APPROVED"), true);
  assert.equal(validOfferStatus("BYPASSED"), false);
});

test("schema contains no hard-coded bootstrap password", () => {
  const schema = fs.readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");
  assert.doesNotMatch(schema, /admin123/);
});

test("admin bulk save uses a database transaction", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.put\("\/api\/admin\/config"/);
  assert.match(server, /client\.query\("begin"\)/);
  assert.match(server, /client\.query\("commit"\)/);
  assert.match(server, /client\.query\("rollback"\)/);
});

test("authenticated users can read public live configuration without private approval settings", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.get\("\/api\/config", requireAuth/);
  assert.match(server, /app\.get\("\/api\/admin", requireAuth, requireAdmin/);
  assert.match(server, /includePrivate \? \[\.\.\.readableAdminEntities, "approvalSettings"\] : readableAdminEntities/);
});

test("question relationships are migrated to stable ids without overwriting existing questions", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.doesNotMatch(server, /await migrateQuestionIds\(\)/);
  assert.match(server, /if \(scopeByName\.has\(key\)\) continue/);
  assert.match(server, /idHeader: "Question ID"[\s\S]*?nameHeader: "Question"/);
  assert.match(server, /idHeader: "Kapsam Soru ID", nameHeader: "Kapsam Sorusu"/);
  assert.match(server, /idHeader: "Geliştirme Soru ID", nameHeader: "Geliştirme Sorusu"/);
  assert.match(server, /definition\.byId\?\.get\(storedId\)/);
  assert.match(server, /row\[nameIndex\] = question\.name/);
  assert.match(server, /function normalizeScopeQuestionStorage/);
  assert.match(server, /delete next\.no/);
  assert.match(server, /next\.scopeQuestions = normalizeScopeQuestionStorage\(next\.scopeQuestions\)/);
  assert.match(server, /for \(const maintenance of posScopeQuestionMaintenance\)/);
  assert.match(server, /scopeByName\.get\(key\) \|\| scopeById\.get\(maintenance\.questionId\)/);
  assert.match(server, /id: maintenance\.questionId[\s\S]*?next\.scopeQuestions\.push\(item\)/);
  assert.match(server, /function upsertPosRestrictionRows/);
  assert.match(server, /next\.restrictions = upsertPosRestrictionRows\(next\.restrictions\)/);
  assert.match(server, /next\.scopeSizeImpacts = upsertPosScopeImpactRows\(next\.scopeSizeImpacts\)/);
});

test("POS scope maintenance restores only requested questions and removes obsolete additions", () => {
  const names = new Set(posScopeQuestionMaintenance.map(item => item.name));
  assert.equal(posScopeQuestionMaintenance.length, 23);
  assert.equal(obsoletePosScopeQuestions.length, 15);
  assert.equal(names.has("Loyalty"), false);
  assert.equal(names.has("Mağaza Sayısı"), true);
  assert.equal(new Set(posScopeQuestionMaintenance.map(item => item.questionId)).size, 23);
});

test("POS development maintenance keeps stable ids and unique question definitions", () => {
  assert.equal(posDevelopmentQuestionMaintenance.length, 15);
  assert.equal(new Set(posDevelopmentQuestionMaintenance.map(item => item.questionId)).size, 15);
  assert.equal(posDevelopmentQuestionMaintenance.find(item => item.name === "CRM entegrasyonları")?.questionId, "dev-11");
  assert.equal(posDevelopmentQuestionMaintenance.find(item => item.name === "CRM entegrasyonları")?.variableType, "Sayı");
});

test("VMP orphan development definitions are restored with stable ids", () => {
  assert.deepEqual(vmpDevelopmentQuestionMaintenance.map(item => item.questionId), ["dev-39", "dev-40", "dev-41"]);
  assert.equal(new Set(vmpDevelopmentQuestionMaintenance.map(item => item.name)).size, 3);
});

test("users, development questions and restrictions use persistent ids", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const schema = fs.readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");
  assert.match(schema, /id uuid primary key default gen_random_uuid\(\)/);
  assert.match(server, /function normalizeDevelopmentQuestionStorage/);
  assert.match(server, /delete next\.no/);
  assert.match(server, /ensureMatrixColumn\(original\.restrictions, "Restriction ID", "Variable Type"\)/);
  assert.match(server, /`restriction-\$\{questionId \|\| type\}`/);
});

test("retail POS restriction batch is rolled back exactly once", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.equal(retailRestrictionRollback.restore.length, 14);
  assert.equal(retailRestrictionRollback.remove.length, 23);
  assert.match(server, /insert into app_migration \(name\)/);
  assert.match(server, /await rollbackLatestRetailRestrictions\(\)/);
  assert.doesNotMatch(server, /ensureRetailRestrictionRows/);
});

test("fallback restrictions omit persisted row numbers and sort by question id", () => {
  const adminData = fs.readFileSync(new URL("../../frontend/public/assets/admin-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(adminData, context);
  const rows = context.window.adminSeedData.restrictions;
  const idIndex = rows[0].indexOf("Question ID");
  assert.equal(rows[0].includes("No"), false);
  assert.equal(rows.length - 1, 131);
  assert.ok(rows.slice(1).every(row => row[idIndex]));
  const ids = Array.from(rows.slice(1), row => String(row[idIndex]));
  assert.deepEqual(ids, [...ids].sort((left, right) => String(left).localeCompare(String(right), "en", { numeric: true, sensitivity: "base" })));
});

test("local seed only initializes an empty admin configuration", () => {
  const seed = fs.readFileSync(new URL("../scripts/seed-admin-data.js", import.meta.url), "utf8");
  assert.match(seed, /if \(count\) \{/);
  assert.match(seed, /Yerel seed uygulanmadı/);
  assert.match(seed, /insert into admin_config/);
  assert.match(seed, /delete next\.no/);
  assert.match(seed, /id: String\(item\.id \|\| `scope-\$\{item\.no\}`\)/);
});

test("offer update SQL uses contiguous parameter numbers", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /total_effort = coalesce\(\$8::numeric, total_effort\)/);
  assert.match(server, /final_effort = coalesce\(\$15::jsonb, final_effort\)/);
  assert.match(server, /and user_id = \$16/);
  assert.doesNotMatch(server, /payload\.systemType,\s*null,\s*totalEffort/s);
});

test("offer list endpoint returns a lightweight project definition summary", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /jsonb_build_object\('version', project_definition->>'version'\) as project_definition/);
});


test("offer list endpoint is scoped to the authenticated user", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.get\("\/api\/offers", requireAuth/);
  assert.match(server, /from offer\s+where user_id = \$1\s+order by updated_at desc/s);
});

test("offer detail endpoint rejects unauthorized viewers", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /async function canViewOffer\(user, offer\)/);
  assert.match(server, /if \(!\(await canViewOffer\(req\.user, result\.rows\[0\]\)\)\) return res\.status\(403\)\.json\(\{ error: "Offer access denied" \}\)/);
});

test("admin deletion requires confirmation and preserves unrelated orphan records", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const source = server.slice(server.indexOf("function matrixHeaderDetails("), server.indexOf('app.put("/api/admin/:entity"'));
  const context = { concurrencyConflict: message => new Error(message) };
  vm.runInNewContext(source, context);
  const previous = { scopeQuestions: [{ id: "s1" }, { id: "s2" }], developmentQuestions: [{ id: "d1" }] };
  const config = {
    scopeQuestions: [{ id: "s2" }], developmentQuestions: [{ id: "d1" }],
    restrictions: [["Question ID", "Variable Type"], ["s1", "Kapsam"], ["d1", "Geliştirme"], ["old-orphan", "Kapsam"]],
    scopeSizeImpacts: [["Question ID", "Puan"], ["s1", 4], ["s2", 0], ["old-orphan", ""]],
    variableModulePhase: [["Kapsam Soru ID", "Geliştirme Soru ID"], ["s1", ""], ["", "d1"], ["", ""], ["old-orphan", ""]],
    __meta: { versions: Object.fromEntries(["scopeQuestions", "developmentQuestions", "restrictions", "scopeSizeImpacts", "variableModulePhase"].map(key => [key, "v1"])) }
  };
  const before = JSON.stringify(config);
  assert.throws(() => context.cascadeDeletedQuestionReferences(config, previous), /açık onay/);
  assert.equal(JSON.stringify(config), before);
  config.__meta.confirmedQuestionDeletions = { scope: ["s1"] };
  context.cascadeDeletedQuestionReferences(config, previous);
  assert.deepEqual(Array.from(config.restrictions.slice(1), row => row[0]), ["d1", "old-orphan"]);
  assert.equal(config.scopeSizeImpacts[1][1], 0);
  assert.equal(config.variableModulePhase.length, 4);
  assert.equal(config.variableModulePhase[2][0], "");
  const after = JSON.stringify(config);
  context.cascadeDeletedQuestionReferences(config, {scopeQuestions: config.scopeQuestions, developmentQuestions: config.developmentQuestions});
  assert.equal(JSON.stringify(config), after);
  assert.doesNotMatch(server, /await migrateQuestionIds\(\)/);
});

test("POS Greenfield phase maintenance uses stable question ids and the configured module", () => {
  assert.equal(posGreenfieldEffortMaintenance.length, 32);
  assert.equal(new Set(posGreenfieldEffortMaintenance.map(item => item.id)).size, 32);
  assert.equal(posGreenfieldEffortMaintenance.some(item => item.name === "Arızi müşteri satışı"), false);
  assert.equal(posGreenfieldEffortMaintenance.filter(item => item.name === "Garanti süreci").length, 1);
  assert.equal(posGreenfieldEffortMaintenance.find(item => item.id === "dev-27").values["Internal Entegrasyon Testi"], 0.5);
  assert.equal(posGreenfieldEffortMaintenance.find(item => item.id === "scope-110").values.Yetkilendirme, 0.125);
  const input = [["Kaynak Tipi", "Kapsam Soru ID", "Kapsam Sorusu", "Geliştirme Soru ID", "Geliştirme Sorusu", "Hedef Modül", "Efor Bazı", "Analiz"], ["Modül", "", "", "", "", "FI", "Sabit", 9]];
  const once = applyPosGreenfieldEffortMaintenance(input);
  const twice = applyPosGreenfieldEffortMaintenance(once);
  const headers = once[0];
  const posRows = once.slice(1).filter(row => row[headers.indexOf("Hedef Modül")] === "NTT Data POS");
  assert.equal(posRows.length, 32);
  assert.equal(once.length, twice.length);
  assert.equal(once[1][headers.indexOf("Analiz")], 9);
  const cashRegister = posRows.find(row => row[headers.indexOf("Kapsam Soru ID")] === "scope-110");
  assert.equal(cashRegister[headers.indexOf("Yetkilendirme")], 0.125);
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /applyPosGreenfieldEffortMaintenance\(result\.rows\[0\]\.payload\)/);
  assert.match(server, /await maintainPosGreenfieldEfforts\(\)/);
});

test("scope question variable type maintenance normalizes live admin data", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /function canonicalScopeVariableType\(value = ""\)/);
  assert.match(server, /\["scope-variable-types-v1"\]/);
  assert.match(server, /variableType: canonicalScopeVariableType\(item\?\.variableType/);
  assert.match(server, /await normalizeScopeQuestionVariableTypes\(\)/);
});

test("conversion scope impact correction replaces placeholders with id-linked implementation rows", () => {
  const headers = ["No", "Question ID", "Implementation Type", "System Type", "Kapsam Sorusu", "Puan", "Katsayı", "Size Etki Tipi"];
  const questions = conversionScopeImpactCorrections.map((item, index) => ({ id: `scope-${index + 1}`, name: item.question }));
  const input = [headers, [1, "scope-1", "All", "All", "CVI / BP Dönüşümü", "", 1, ""]];
  const once = applyConversionScopeImpactCorrections(input, questions);
  const twice = applyConversionScopeImpactCorrections(once, questions);
  assert.equal(once.length, 21);
  assert.equal(twice.length, 21);
  assert.equal(once.slice(1).some(row => row[2] === "All"), false);
  const simplification = once.slice(1).filter(row => row[1] === "scope-4");
  assert.deepEqual(simplification.map(row => row[5]), [0.4, 0.3, 0.1, 0.3]);
  assert.ok(simplification.every(row => row[6] === 1 && row[7] === "Katsayı"));
  const cvi = once.slice(1).filter(row => row[1] === "scope-1");
  assert.deepEqual(cvi.map(row => row[5]), [20, 0, 10, 10]);
});

test("legacy POS module is merged into the NTT Own IP module without losing references", () => {
  const catalog = normalizePosModuleCatalog([
    { module: "POS", group: "Advanced Solution", selected: true },
    { module: "NTT Data POS", group: "NTT Own IP", selected: false },
    { module: "FI", group: "S4Core" }
  ]);
  assert.equal(catalog.filter(item => item.module === "NTT Data POS").length, 1);
  assert.equal(catalog.find(item => item.module === "NTT Data POS").group, "NTT Own IP");
  assert.equal(catalog.some(item => item.module === "POS"), false);
  const payload = replaceLegacyPosModule({ modules: ["POS", "FI"], efforts: { POS: { Analiz: 2 }, "NTT Data POS": { Uyarlama: 3 } } });
  assert.deepEqual(payload.modules, ["NTT Data POS", "FI"]);
  assert.deepEqual(payload.efforts["NTT Data POS"], { Uyarlama: 3, Analiz: 2 });
});

test("admin password reset is protected, validates length and stores only a hash", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.put\("\/api\/admin\/users\/:id\/password", requireAuth, requireAdmin/);
  assert.match(server, /if \(newPassword\.length < 12\)/);
  assert.match(server, /normalizeEmail\(target\.rows\[0\]\.email\) === protectedAdminEmail/);
  assert.match(server, /password_hash = crypt\(\$2, gen_salt\('bf'\)\)/);
  assert.doesNotMatch(server, /returning[^;]*password_hash/);
});

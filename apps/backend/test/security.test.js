import test from "node:test";
import assert from "node:assert/strict";
import { bearerToken, createAccessToken, validOfferStatus, verifyAccessToken } from "../src/auth.js";
import fs from "node:fs";
import vm from "node:vm";
import { retailRestrictionRollback } from "../src/restriction-rollback.js";
import { obsoletePosScopeQuestions, posScopeQuestionMaintenance } from "../src/scope-question-migrations.js";

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
  assert.match(server, /await migrateQuestionIds\(\)/);
  assert.match(server, /if \(scopeByName\.has\(key\)\) continue/);
  assert.match(server, /idHeader: "Question ID"[\s\S]*?nameHeader: "Question"/);
  assert.match(server, /idHeader: "Kapsam Soru ID", nameHeader: "Kapsam Sorusu"/);
  assert.match(server, /idHeader: "Geliştirme Soru ID", nameHeader: "Geliştirme Sorusu"/);
  assert.match(server, /function normalizeScopeQuestionStorage/);
  assert.match(server, /delete next\.no/);
  assert.match(server, /next\.scopeQuestions = normalizeScopeQuestionStorage\(next\.scopeQuestions\)/);
  assert.match(server, /for \(const maintenance of posScopeQuestionMaintenance\)/);
  assert.match(server, /scopeByName\.get\(key\) \|\| scopeById\.get\(maintenance\.questionId\)/);
  assert.match(server, /id: maintenance\.questionId[\s\S]*?next\.scopeQuestions\.push\(item\)/);
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
  assert.equal(rows.length - 1, 105);
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

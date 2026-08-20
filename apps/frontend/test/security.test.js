import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../public/index.html", import.meta.url), "utf8");
const apiClient = fs.readFileSync(new URL("../public/assets/api-client.js", import.meta.url), "utf8");

test("API client sends bearer authentication", () => {
  assert.match(apiClient, /Authorization:\s*`Bearer \$\{accessToken\}`/);
});

test("API client keeps authorization when sending update precondition headers", () => {
  assert.match(apiClient, /headers:\s*\{\s*"Content-Type":\s*"application\/json",\s*\.\.\.\(accessToken \? \{ Authorization:\s*`Bearer \$\{accessToken\}` \} : \{\}\),\s*\.\.\.optionHeaders/s);
  assert.match(apiClient, /headers:\s*expectedUpdatedAt \? \{ "If-Match": expectedUpdatedAt \} : \{\}/);
});

test("offer actions distinguish owners from viewers", () => {
  assert.match(html, /function isOfferOwner\(offer\)/);
  assert.match(html, /if \(!isOfferOwner\(offer\)\) accessMode = "view"/);
});

test("stored offer text is HTML escaped", () => {
  assert.match(html, /escapeHtml\(row\.customer_name/);
  assert.match(html, /escapeHtml\(offer\.customer_name/);
  assert.match(html, /contenteditable="true">\$\{escapeHtml/);
});

test("library count only includes visible checked records", () => {
  assert.match(html, /querySelectorAll\("\[data-library-item\]:checked"\)\.length/);
});

test("library records use background UUID values", () => {
  assert.match(html, /crypto\.randomUUID\(\)/);
  assert.match(html, /headers\.indexOf\("ID"\)/);
});

test("admin configuration is saved in one request", () => {
  assert.match(html, /EffortApi\.saveAdminConfig\(config\)/);
  assert.doesNotMatch(html, /Promise\.all\(Object\.entries\(config\)/);
});

test("large Excel library is lazy-loaded", () => {
  assert.doesNotMatch(html, /<script src="assets\/xlsx\.full\.min\.js"><\/script>/);
  assert.match(html, /function ensureXlsxLoaded\(\)/);
  assert.match(html, /await ensureXlsxLoaded\(\)/);
});

test("authenticated header buttons render before heavier data hydration", () => {
  assert.match(html, /currentUser = await window\.EffortApi\.me\(\);\s*showAuthenticatedApp\(\);[\s\S]*?const adminConfigPromise = loadAdminConfig\(\{ render: false \}\)/s);
  assert.match(html, /currentUser = await window\.EffortApi\.login\(\{[\s\S]*?\}\);\s*showAuthenticatedApp\(\);\s*setWorkMode\(false\);[\s\S]*?hydrateHomeData\(\)\.then\(\(\) => applyLanguage\(\)\);/s);
});

test("new offer screen opens before heavy panel hydration", () => {
  assert.match(html, /function hydrateNewOfferScreens\(\)/);
  assert.match(html, /setProjectForm\(\{[\s\S]*?\}, \{ preserveAnswers: false, renderQuestions: false \}\);\s*resetSelectableState\("new", null, \{ render: false \}\);[\s\S]*?openWork\("project"\);[\s\S]*?hydrateNewOfferScreens\(\);/s);
});

test("question restriction rows preserve question values by stable id", () => {
  assert.match(html, /const displayName = questionDisplayName\(questionType, questionId, question\)/);
  assert.match(html, /\.filter\(row => row\[2\] \|\| row\[3\]\)/);
  assert.match(html, /const current = questionDisplayName\(questionType, idValue, currentText\)/);
  assert.match(html, /uniqueOptionValues\(\["", \.\.\.adminQuestionNamesByType\(typeSelect\.value\), current\]\)/);
});

test("duplicate 3rd party integration scope question is canonicalized", () => {
  assert.match(html, /fromIds:\s*\["scope-54"\]/);
  assert.match(html, /fromNames:\s*\["Kaç farklı 3rd party entegrasyon sayısı bulunmaktadır\?"\]/);
  assert.match(html, /toId:\s*"scope-40"/);
  assert.match(html, /toName:\s*"3rd Party Entegrasyon Sayısı"/);
  assert.match(html, /const key = \[questionTypeFromLabel\(row\[1\]\), row\[2\] \|\| normalizeQuestionName\(row\[3\]\)\]/);
});

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

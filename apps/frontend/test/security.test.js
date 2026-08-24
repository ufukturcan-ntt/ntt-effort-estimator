import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

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
  assert.match(html, /escapeHtml\(displayRecord\(row\.customer_name/);
  assert.match(html, /escapeHtml\(displayRecord\(offer\.customer_name/);
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

test("authenticated home data loads before deferred admin configuration", () => {
  assert.match(html, /function ensureAdminConfigLoaded\(options = \{\}\)/);
  assert.match(html, /function scheduleDeferredAdminConfigHydration\(delay = 8000\)/);
  assert.match(html, /async function hydrateHomeData\(\) \{\s*const offersPromise = loadOffers\(\)/s);
  assert.match(html, /scheduleDeferredAdminConfigHydration\(\);\s*return offersPromise;/s);
  assert.match(html, /async function openNewOffer\(\) \{\s*await ensureAdminConfigLoaded\(\{ render: false \}\)/s);
  assert.match(html, /topAdminButton"\)\.addEventListener\("click", async \(\) => \{\s*await ensureAdminConfigLoaded\(\{ render: false \}\)/s);
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

test("login language rendering avoids immediate translation churn", () => {
  assert.match(html, /if \(recordTranslations\[text\]\) return recordTranslations\[text\]/);
  assert.match(html, /setTimeout\(flushTranslationQueue, 250\)/);
  assert.match(html, /function scheduleLanguageDynamicRefresh\(\)/);
  assert.doesNotMatch(html, /hydrateHomeData\(\)\.then\(\(\) => applyLanguage\(\)\);\s*applyLanguage\(\);\s*wakeTranslationQueue\(\);/);
});

test("login does not expose demo work as active offer", () => {
  assert.match(html, /let currentOfferMode = ""/);
  assert.doesNotMatch(html, /<input id="projectCustomer" value="Ufuk Enerji AŞ"/);
  assert.doesNotMatch(html, /<input id="projectName" value="S4 Dönüşüm"/);
  assert.match(html, /loadOffers\(\)\s*\n\s*\.then\(\(\) => applyLanguage\(\)\)/);
});

test("user menu actions are translated with the selected language", () => {
  assert.match(html, /changePassword: "Change Password"/);
  assert.match(html, /logout: "Logout"/);
  assert.match(html, /setTextContent\("#togglePasswordPanelButton", t\("changePassword"\)\)/);
  assert.match(html, /setTextContent\("#logoutButton", t\("logout"\)\)/);
  assert.match(html, /alert\(t\("passwordChanged"\)\)/);
});

test("question selections defer heavy effort rendering", () => {
  const metricsBlock = html.match(/function updateQuestionMetrics\(\) \{([\s\S]*?)\n    \}/)?.[1] || "";
  assert.doesNotMatch(metricsBlock, /renderFinalEffort\(/);
  assert.doesNotMatch(metricsBlock, /renderDevelopmentEfforts\(/);
  assert.match(html, /control\.addEventListener\(control\.tagName === "SELECT" \? "change" : "input", applyQuestionAnswer\)/);
  assert.doesNotMatch(html, /control\.addEventListener\("input", \(\) => \{[\s\S]*?control\.addEventListener\("change", \(\) => \{/);
});

test("offer list and detail rendering avoid repeated backend reloads", () => {
  assert.match(html, /let offersLoadPromise = null/);
  assert.match(html, /const offerDetailPromises = new Map\(\)/);
  assert.match(html, /function getOfferDetail\(offerId\)/);
  assert.match(html, /const fresh = cachedOffers\.length && offersLoadedAt/);
  assert.match(html, /if \(!force && offersLoadPromise\) return offersLoadPromise/);
  assert.match(html, /const offer = await getOfferDetail\(offerId\)/);
});

test("offer records use translation display helpers in English mode", () => {
  assert.match(html, /function phraseTranslatedRecord\(text\)/);
  assert.match(html, /return phraseTranslation !== text \? phraseTranslation : text/);
  assert.match(html, /displayRecord\(row\.industry \|\| ""\)/);
  assert.match(html, /displayRecord\(row\.implementation_type \|\| ""\)/);
  assert.match(html, /displayRecord\(offer\.industry \|\| ""\)/);
  assert.match(html, /map\(displayRecord\)\.join\(" \/ "\)/);
});

test("welcome header uses the authenticated user identity", () => {
  assert.doesNotMatch(html, /welcome: "Welcome Ufuk Turcan"/);
  assert.doesNotMatch(html, /welcome: "Hoş geldin Ufuk Turcan"/);
  assert.doesNotMatch(html, />Hoş geldin Ufuk Turcan</);
  assert.match(html, /function currentUserDisplayName\(\)/);
  assert.match(html, /function currentWelcomeText\(\)/);
  assert.match(html, /function updateUserIdentity\(\)/);
  assert.match(html, /setTextContent\("\.top-brand-text strong", currentWelcomeText\(\)\)/);
  assert.match(html, /setTextContent\("aside \.brand span", currentWelcomeText\(\)\)/);
  assert.match(html, /subtitle\.textContent = app\?\.classList\.contains\("work-open"\) \? currentWorkSubtitle\(\) : currentWelcomeText\(\)/);
});

test("home dashboard distribution panels are translated", () => {
  assert.match(html, /industryDistribution: "Industry distribution"/);
  assert.match(html, /implementationDistribution: "Implementation distribution"/);
  assert.match(html, /systemDistribution: "System distribution"/);
  assert.match(html, /setTexts\("\.home-only \.panel-title", \[t\("portfolio"\), t\("quickAnalysis"\), t\("industryDistribution"\), t\("implementationDistribution"\), t\("systemDistribution"\)\]\)/);
  assert.match(html, /setTexts\("\.home-only \.pill", \[t\("month"\), t\("offer"\), t\("offer"\), t\("offer"\)\]\)/);
});

test("project filter changes defer question list rendering", () => {
  assert.match(html, /let questionListRenderTimer = null/);
  assert.match(html, /function scheduleQuestionListRefresh\(options = \{\}, delay = 40\)/);
  assert.match(html, /scheduleQuestionListRefresh\(\);\s*scheduleWorkbookDrivenRender\(90\);/);
  assert.doesNotMatch(html, /document\.getElementById\(id\)\?\.addEventListener\("change", \(\) => \{\s*refreshQuestionLists\(\);\s*scheduleWorkbookDrivenRender\(\);/);
});

test("common Turkish admin records have immediate English translations", () => {
  assert.match(html, /"Hizmet": "Service"/);
  assert.match(html, /"Kategori": "Category"/);
  assert.match(html, /"Sayı": "Number"/);
  assert.match(html, /looksTurkishText[\s\S]*hizmet/);
  assert.match(html, /looksTurkishText[\s\S]*sayı/);
  assert.match(html, /setTimeout\(flushTranslationQueue, 250\)/);
});

test("conversion scope questions have immediate English labels", () => {
  assert.match(html, /"A\. Organizasyon & Kapsam": "A\. Organization & Scope"/);
  assert.match(html, /"Industry Solution Kullanımı": "Industry Solution Usage"/);
  assert.match(html, /"ISU, IS-Retail, DIMP, IS-Oil vb\. sektör çözümü kullanılmakta mıdır\?": "Is an industry solution such as ISU, IS-Retail, DIMP, IS-Oil etc\. being used\?"/);
  assert.match(html, /"Organizasyon Ayrıştırma Kapsamı": "Organization Separation Scope"/);
  assert.match(html, /organizasyon\|kapsam\|kategori/);
});
test("seeded question labels do not render mixed Turkish in English mode", () => {
  const questionsJs = fs.readFileSync(new URL("../public/assets/questions.js", import.meta.url), "utf8");
  const adminDataJs = fs.readFileSync(new URL("../public/assets/admin-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(questionsJs, context);
  vm.runInNewContext(adminDataJs, context);
  const extractConst = name => Function(`return (${html.match(new RegExp(`const ${name} = ([\\s\\S]*?);\\n\\s*(?:const|function)`, "m"))[1]})`)();
  const recordTranslations = extractConst("recordTranslations");
  const recordDescriptionTranslations = extractConst("recordDescriptionTranslations");
  const badTurkish = /[çğıöşüÇĞİÖŞÜ]|\b(organizasyon|kapsam|soru|tanım|açıklama|dönüşüm|olacak|mıdır|adet|sayı|bulunmaktadır|olacaktır|scopeda|warehouselar|companyler)\b/i;
  const display = value => recordTranslations[String(value ?? "")] || recordDescriptionTranslations[String(value ?? "")] || "Translation pending...";
  const rows = [];
  for (const type of ["scopeQuestions", "developmentQuestions"]) {
    for (const question of context.window[type] || []) {
      for (const field of ["category", "name", "description"]) {
        if (!question[field]) continue;
        const rendered = display(question[field]);
        if (badTurkish.test(rendered)) rows.push(`${type}:${question.no}:${field}:${rendered}`);
      }
    }
  }
  for (const tableName of ["scope", "development"]) {
    const table = context.window.adminSeedData?.[tableName] || [];
    const headerIndex = table.findIndex(row => row?.[0] === "No");
    if (headerIndex < 0) continue;
    for (const row of table.slice(headerIndex + 1)) {
      for (const value of [row?.[1], row?.[2]]) {
        if (!value) continue;
        const rendered = display(value);
        if (badTurkish.test(rendered)) rows.push(`admin-${tableName}:${row?.[0]}:${rendered}`);
      }
    }
  }  assert.deepEqual(rows, []);
  assert.match(html, /"Benzer işi-süreci olan depolar göz önüne alındığında kaç farklı yapıda depo yapısı bulunmaktadır\.": "Considering warehouses with similar business processes, how many different warehouse structures are there\?"/);
  assert.match(html, /"Teslimat planı kullanımı ihtiyacı bulunmakta mıdır\?": "Is scheduling agreement usage required\?"/);
});
test("admin question seed stays synchronized with bundled questions", () => {
  const questionsJs = fs.readFileSync(new URL("../public/assets/questions.js", import.meta.url), "utf8");
  const adminDataJs = fs.readFileSync(new URL("../public/assets/admin-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(questionsJs, context);
  vm.runInNewContext(adminDataJs, context);
  const adminQuestions = tableName => {
    const table = context.window.adminSeedData?.[tableName] || [];
    const headerIndex = table.findIndex(row => row?.[0] === "No");
    return table.slice(headerIndex + 1).filter(row => row?.[0]).map(row => ({
      no: Number(row[0]),
      name: String(row[1] || ""),
      description: String(row[2] || ""),
      answerType: String(row[3] || "")
    }));
  };
  const questionRows = key => (context.window[key] || []).map(question => ({
    no: Number(question.no),
    name: String(question.name || ""),
    description: String(question.description || ""),
    answerType: String(question.variableType || (question.answerType === "number" ? "Sayı" : question.answerType === "yesno" ? "Evet / Hayır" : question.answerType || "")).replace("Evet/Hayır", "Evet / Hayır")
  }));
  assert.deepEqual(adminQuestions("scope"), questionRows("scopeQuestions"));
  assert.deepEqual(adminQuestions("development"), questionRows("developmentQuestions"));
});
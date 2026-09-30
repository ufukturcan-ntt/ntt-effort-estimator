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

test("library headers are translated in English mode", () => {
  assert.match(html, /"Geliştirme Tanımı": "Development Definition"/);
  assert.match(html, /"Geliştirme Açıklaması": "Development Description"/);
  assert.match(html, /"Kapsamda": "In Scope"/);
  assert.match(html, /setTexts\("#library thead th", \[displayRecord\("Geliştirme Tanımı"\), displayRecord\("Açıklama"\), displayRecord\("Modül"\), displayRecord\("Kapsamda"\)\]\)/);
  assert.match(html, /<th>\$\{escapeHtml\(displayRecord\("İşlem"\)\)\}<\/th>/);
});

test("effort analysis summaries and dashboards are translated in English mode", () => {
  assert.match(html, /effortDistribution: "Effort distribution"/);
  assert.match(html, /solutionGroupEfforts: "Solution group efforts"/);
  assert.match(html, /fixedEffort: "Fixed effort"/);
  assert.match(html, /localizationEffortSummary: "Localization effort"/);
  assert.match(html, /hypercareGoliveEffort: "Hypercare \+ Go-Live effort"/);
  assert.match(html, /setTexts\("#effort > \.effort-stack > \.panel > \.panel-head \.panel-title", \[t\("projectEfforts"\), t\("localizationEfforts"\), t\("developmentEfforts"\), t\("finalSummary"\)\]\)/);
  assert.match(html, /setTexts\("#effort \.summary-grid \.metric span", \[t\("standardProjectEffort"\), t\("fixedEffort"\), t\("developmentEffort"\), t\("localizationEffortSummary"\), t\("hypercareGoliveEffort"\), t\("totalEffortSummary"\)\]\)/);
  assert.match(html, /setTexts\("#effort \.dashboard-grid \.panel-title", \[t\("effortDistribution"\), t\("solutionGroupEfforts"\)\]\)/);
  assert.match(html, /\[displayRecord\("Hypercare \+ Go-Live eforu"\), hypercareTotal/);
  assert.match(html, /<strong>\$\{escapeHtml\(displayRecord\(label\)\)\}<\/strong>/);
});

test("admin configuration is saved in one request", () => {
  assert.match(html, /EffortApi\.saveAdminConfig\(config\)/);
  assert.doesNotMatch(html, /Promise\.all\(Object\.entries\(config\)/);
});

test("admin save preserves in-progress restriction edits", () => {
  assert.match(html, /function renderUnrenderedAdminSections\(\)/);
  assert.match(html, /renderUnrenderedAdminSections\(\);\s*const config = collectAdminConfig\(\)/);
  assert.doesNotMatch(html, /renderAdminPage\(\{ all: true \}\);\s*const config = collectAdminConfig\(\)/);
});

test("large Excel library is lazy-loaded", () => {
  assert.doesNotMatch(html, /<script src="assets\/xlsx\.full\.min\.js"><\/script>/);
  assert.match(html, /function ensureXlsxLoaded\(\)/);
  assert.match(html, /await ensureXlsxLoaded\(\)/);
});

test("screen data is loaded lazily after authentication", () => {
  assert.match(html, /function ensureAdminConfigLoaded\(options = \{\}\) \{\s*if \(!currentUser\) return Promise\.resolve\(\)/s);
  assert.match(html, /function scheduleDeferredAdminConfigHydration\(delay = 8000\) \{\s*if \(!currentUser \|\| adminConfigLoaded/s);
  assert.match(html, /currentUser\?\.is_admin\s*\? await window\.EffortApi\.adminData\(\)\s*: await window\.EffortApi\.configData\(\)/s);
  assert.match(html, /async function hydrateHomeData\(\) \{\s*scheduleDeferredAdminConfigHydration\(\);\s*return Promise\.resolve\(\);\s*\}/s);
  assert.match(html, /if \(screenId === "overview" \|\| screenId === "allworks"\) \{\s*renderAllWorks\(\);\s*loadOffers\(\{ maxAge: 60000 \}\)/s);
  assert.match(html, /async function openNewOffer\(\) \{\s*refreshProjectDefinitionSelects\(\);\s*await ensureAdminConfigLoaded\(\{ render: false \}\);\s*refreshProjectDefinitionSelects\(\);/s);
  assert.match(html, /topAdminButton"\)\.addEventListener\("click", async \(\) => \{\s*await ensureAdminConfigLoaded\(\{ render: false \}\)/s);
  assert.doesNotMatch(html, /const offersPromise = loadOffers\(\)/);
});

test("admin refresh waits for persisted configuration before rendering", () => {
  assert.match(html, /const screenId = storedScreenId\(\);\s*const offerContext = storedOfferContext\(\);\s*if \(screenId === "admin"\) await ensureAdminConfigLoaded\(\{ render: false \}\);\s*if \(!offerScreens\.has\(screenId\)\) openScreen\(screenId\);/s);
  assert.match(html, /else if \(screenId !== "admin"\) \{\s*scheduleDeferredAdminConfigHydration\(\);\s*\}/s);
});

test("new offer screen opens before heavy panel hydration", () => {
  assert.match(html, /function hydrateNewOfferScreens\(\)/);
  assert.match(html, /setProjectForm\(\{[\s\S]*?\}, \{ preserveAnswers: false, renderQuestions: false \}\);\s*resetSelectableState\("new", null, \{ render: false \}\);[\s\S]*?openWork\("project"\);[\s\S]*?hydrateNewOfferScreens\(\);/s);
});

test("new offer always starts with an empty module selection", () => {
  assert.doesNotMatch(html, /selected:true/);
  assert.match(html, /function clearModuleSelectionState\(\) \{[\s\S]*?state\.selected = false;[\s\S]*?state\.team = "";/s);
  assert.match(html, /resetSelectableState\("new", null, \{ render: false \}\);\s*clearModuleSelectionState\(\);/s);
});

test("question restriction rows preserve question values by stable id", () => {
  assert.match(html, /const displayName = questionDisplayName\(questionType, questionId, question\)/);
  assert.match(html, /\.filter\(row => row\[2\] \|\| row\[3\]\)/);
  assert.match(html, /const current = questionDisplayName\(questionType, idValue, currentText\)/);
  assert.match(html, /uniqueOptionValues\(\["", \.\.\.adminQuestionNamesByType\(typeSelect\.value\), current\]\)/);
  assert.match(html, /const restrictionStorageHeaders = restrictionHeaders\.slice\(1\)/);
  assert.match(html, /return \[restrictionStorageHeaders, \.\.\.normalized\.slice\(1\)\.map\(row => row\.slice\(1\)\)\]/);
  assert.match(html, /String\(left\[2\] \|\| ""\)\.localeCompare\(String\(right\[2\] \|\| ""\), "en", \{ numeric: true/);
  assert.match(html, /class="restriction-row-number"/);
  assert.match(html, /return restrictionStorageRows\(\[headers, \.\.\.rows\]\)/);
});

test("question restrictions omit notes and usage columns", () => {
  assert.match(html, /const restrictionHeaders = \["No", "Variable Type", "Question ID", "Question", "Allowed Industries", "Allowed Implementation Types", "Allowed System Types", "Active\?"\];/);
  assert.doesNotMatch(html, /row\[idx\("Notes"\)\]/);
  assert.doesNotMatch(html, /row\[idx\("Usage"\)\]/);
});

test("duplicate 3rd party integration scope question is canonicalized", () => {
  assert.match(html, /fromIds:\s*\["scope-54"\]/);
  assert.match(html, /fromNames:\s*\["Kaç farklı 3rd party entegrasyon sayısı bulunmaktadır\?"\]/);
  assert.match(html, /toId:\s*"scope-40"/);
  assert.match(html, /toName:\s*"3rd Party Entegrasyon Sayısı"/);
  assert.match(html, /const key = \[questionTypeFromLabel\(row\[1\]\), row\[2\] \|\| normalizeQuestionName\(row\[3\]\)\]/);
});

test("scope restrictions and numeric answers are guarded in the offer flow", () => {
  assert.match(html, /const implementationTypes = displayName\.includes\("TSA \/ Paralel İşletim"\)[\s\S]*?\? "Carve-out"[\s\S]*?: canonicalImplementationList\(rawImplementationTypes\)/s);
  assert.match(html, /function questionCategoryLabel\(item = \{\}, targetId = ""\)/);
  assert.match(html, /<input type="number" min="0" step="1" inputmode="numeric"/);
  assert.match(html, /if \(control\.type === "number" && Number\(control\.value\) < 0\) control\.value = "0"/);
  assert.match(html, /if \(\["-", "e", "E", "\+"\]\.includes\(event\.key\)\) event\.preventDefault\(\)/);
});

test("NTT own IP records have immediate English labels", () => {
  assert.match(html, /"NTT Own IP": "NTT Own IP"/);
  assert.match(html, /"E-Fatura\/Arşiv": "E-Invoice \/ E-Archive"/);
  assert.match(html, /"Dış Ticaret Çözümü": "Foreign Trade Solution"/);
});

test("login applies selected language before showing the app", () => {
  assert.match(html, /currentLanguage = document\.getElementById\("languageSelect"\)\?\.value \|\| currentLanguage \|\| "tr"/);
  assert.match(html, /function showAuthenticatedApp\(\) \{\s*applyUserPermissions\(\);\s*applyLanguage\(\);\s*document\.getElementById\("loginShell"\)\?\.classList\.add\("is-hidden"\)/s);
});

test("login language rendering avoids immediate translation churn", () => {
  assert.match(html, /if \(recordTranslations\[text\]\) return recordTranslations\[text\]/);
  assert.match(html, /setTimeout\(flushTranslationQueue, 250\)/);
  assert.match(html, /function scheduleLanguageDynamicRefresh\(\)/);
  assert.doesNotMatch(html, /hydrateHomeData\(\)\.then\(\(\) => applyLanguage\(\)\);\s*applyLanguage\(\);\s*wakeTranslationQueue\(\);/);
});

test("login does not expose demo data or default credentials", () => {
  assert.match(html, /let currentOfferMode = ""/);
  assert.doesNotMatch(html, /<input id="projectCustomer" value="Ufuk Enerji AŞ"/);
  assert.doesNotMatch(html, /<input id="projectName" value="S4 Dönüşüm"/);
  assert.doesNotMatch(html, /value="ufuk\.turcan@nttdata\.com"/);
  assert.doesNotMatch(html, /value="admin123"/);
  assert.doesNotMatch(html, /EffortApi\.login\([\s\S]*admin123/);
  assert.match(html, /throw new Error\(currentLanguage === "en" \? "Authentication required" : "Oturum gerekli"\)/);
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

test("workbook rendering is scoped to the active screen", () => {
  assert.ok(html.includes("function activeScreenId()"));
  assert.ok(html.includes("function calculateProjectEffortTotal()"));
  assert.ok(html.includes("function calculateDevelopmentEffortTotal()"));
  assert.ok(html.includes("function currentEffortTotals()"));
  assert.ok(html.includes("const screenId = activeScreenId()"));
  assert.ok(html.includes('if (screenId === "localization") renderLocalizationControls()'));
  assert.ok(html.includes('if (screenId === "library") renderLibraryRows()'));
  assert.ok(html.includes('if (screenId === "effort") {'));
  assert.ok(html.includes("localizationTotal = renderLocalizationEfforts()"));
  assert.ok(html.includes("projectTotal = renderFinalEffort()"));
  assert.ok(html.includes("developmentTotal = renderDevelopmentEfforts()"));
  assert.ok(html.includes('if (screenId === "effort") renderDashboards'));
});

test("language translation refresh is scoped to the active screen", () => {
  const translatedStart = html.indexOf("function scheduleTranslatedViewRefresh()");
  const languageStart = html.indexOf("function scheduleLanguageDynamicRefresh()");
  const languageEnd = html.indexOf("function displayPhase", languageStart);
  const translatedRefresh = html.slice(translatedStart, languageStart);
  const languageRefresh = html.slice(languageStart, languageEnd);
  assert.ok(translatedRefresh.includes("const screenId = activeScreenId()"));
  assert.ok(translatedRefresh.includes('["scope", "developments"].includes(screenId)'));
  assert.ok(languageRefresh.includes("const screenId = activeScreenId()"));
  assert.ok(languageRefresh.includes('if (screenId === "admin") renderAdminPageIfNeeded?.(true)'));
  assert.ok(languageRefresh.includes('["fixedefforts", "localization", "hypercare", "effort"].includes(screenId)'));
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
      answerType: String(row[3] || "").replace("Evet/Hayır", "Evet / Hayır")
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

test("only requested POS scope questions are bundled and seeded", () => {
  const questionsJs = fs.readFileSync(new URL("../public/assets/questions.js", import.meta.url), "utf8");
  const adminDataJs = fs.readFileSync(new URL("../public/assets/admin-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(questionsJs, context);
  vm.runInNewContext(adminDataJs, context);
  const expected = [
    "OKC kullanımı", "EFT POS kullanılıyor mu?",
    "Mağaza teslim alım süreci kullanılacak mı? (C&C)",
    "Kaç dil için ekran kullanımı olacaktır?", "Değişim süreci",
    "Satış sonrası hizmet süreci", "Garanti süreci", "Kasa kapanışı günlük yapılıyor mu?",
    "Dış sistem entegrasyonları", "Mağaza Sayısı", "Kasa Sayısı", "Mağaza içi depo sayısı"
  ];
  const excluded = [
    "Click and Collect süreci", "Müşteri teslim et süreci kullanılacak mı? (C&C)",
    "E-çözümler süreci ile POS entegrasyonu var mı?", "Lokalizasyon", "Tax free satış",
    "Vergi istisnai satış", "Merkez kasa/yönetim kasası yönetimi", "CRM entegrasyonları",
    "Loyalty", "Kupon kullanımı", "Gift Card kullanımı var mı?",
    "Kampanya hesaplaması kasa üzerinde mi yapılacak?",
    "Marketing kampanyaları ya da tarihli kampanyalar kasada tutulacak mı?",
    "Kampanya tipleri ve sayısı", "Localization Selection"
  ];
  const bundled = new Set(context.window.scopeQuestions.map(item => item.name));
  const scopeTable = context.window.adminSeedData.scope;
  const headerIndex = scopeTable.findIndex(row => row?.[0] === "No");
  const seeded = new Set(scopeTable.slice(headerIndex + 1).map(row => row?.[1]));
  expected.forEach(name => {
    assert.ok(bundled.has(name), `Bundled scope question missing: ${name}`);
    assert.ok(seeded.has(name), `Seeded scope question missing: ${name}`);
  });
  excluded.forEach(name => {
    assert.equal(bundled.has(name), false, `Unexpected bundled scope question: ${name}`);
    assert.equal(seeded.has(name), false, `Unexpected seeded scope question: ${name}`);
  });
  assert.equal(context.window.scopeQuestions.length, 89);
  assert.ok(context.window.scopeQuestions.filter(item => expected.includes(item.name)).every(item => item.sizeImpact === false));
});

test("POS scope questions and Greenfield size impacts are seeded", () => {
  const questionsJs = fs.readFileSync(new URL("../public/assets/questions.js", import.meta.url), "utf8");
  const adminDataJs = fs.readFileSync(new URL("../public/assets/admin-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(questionsJs, context);
  vm.runInNewContext(adminDataJs, context);
  const expectedQuestions = new Map([
    ["Mağaza Sayısı", ["scope-109", "Sayı"]],
    ["Kasa Sayısı", ["scope-110", "Sayı"]],
    ["Mağaza içi depo sayısı", ["scope-111", "Sayı"]]
  ]);
  for (const [name, [id, variableType]] of expectedQuestions) {
    const question = context.window.scopeQuestions.find(item => item.name === name);
    assert.equal(question?.id, id);
    assert.equal(question?.variableType, variableType);
  }
  const impacts = context.window.adminSeedData.scopeSizeImpacts;
  const headers = impacts[0];
  const value = (row, header) => row[headers.indexOf(header)];
  const expectedScores = new Map([["scope-109", 0.5], ["scope-110", 0.5], ["scope-111", 1]]);
  for (const [id, score] of expectedScores) {
    const row = impacts.slice(1).find(item => value(item, "Question ID") === id);
    assert.equal(value(row, "Implementation Type"), "Greenfield");
    assert.equal(value(row, "System Type"), "NTT POS on S4, NTT POS on CAR, Offline POS");
    assert.equal(Number(value(row, "Puan")), score);
    assert.equal(Number(value(row, "Katsayı")), 1);
    assert.equal(value(row, "Size Etki Tipi"), "Katsayı");
  }
});

test("scope questions use stable ids for storage and generated display numbers", () => {
  assert.match(html, /config\[configKey\] = configKey === "scopeQuestions"\s*\? normalizeScopeQuestionRows\(combined\)/s);
  assert.match(html, /id: String\(item\.id \|\| item\.questionId \|\| ""\)\.trim\(\) \|\| stableQuestionId\("scope", item\.no \|\| index \+ 1, item\.name\)/);
  assert.match(html, /\.map\(\(item, index\) => \(\{ \.\.\.item, no: index \+ 1 \}\)\)/);
  assert.match(html, /<td class="scope-question-row-number">\$\{noValue\}<\/td>/);
  assert.match(html, /function renumberScopeQuestionDisplayRows/);
  assert.doesNotMatch(html, /id: row\.dataset\.questionId \|\| stableQuestionId\("scope", "", cells\[3\]\),\s*no:/s);
});

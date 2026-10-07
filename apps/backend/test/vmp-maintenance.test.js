import assert from "node:assert/strict";
import { mergeFvbVmpRows, removeObsoleteTeamSplitScopeQuestion } from "../src/vmp-maintenance.js";

const headers = [
  "Implementation Type", "Kaynak Tipi", "Kapsam Soru ID", "Kapsam Sorusu",
  "Geliştirme Soru ID", "Geliştirme Sorusu", "Hedef Modül", "Efor Bazı", "Tarih",
  "Analiz", "Dokümantasyon", "Uyarlama", "Birim Test"
];
const row = (module, analysis, documentation, customizing, unitTest) => [
  "All", "Değişken", "", "", "dev-59", "Üretim ana veri yaratma otomasyonu (FVB)",
  module, "Sabit", "2026-08-04", analysis, documentation, customizing, unitTest
];
const input = [
  headers,
  row("ABAP", "", "", 15, ""), row("ABAP", "", "", 14, ""),
  row("MM", 4, 2, "", 3), row("MM", "", "", 8, ""),
  row("PP", 4, 2, "", 3), row("PP", "", "", 6, ""),
  ["All", "Değişken", "", "", "dev-60", "Başka geliştirme", "ABAP", "Sabit", "2026-08-04", "", "", 7, ""]
];

const result = mergeFvbVmpRows(input);
const at = Object.fromEntries(headers.map((header, index) => [header, index]));
const find = module => result.slice(1).find(item => item[at["Geliştirme Soru ID"]] === "dev-59" && item[at["Hedef Modül"]] === module);

assert.equal(result.length, input.length - 3);
assert.equal(find("ABAP")[at.Uyarlama], 29);
assert.deepEqual(
  [find("MM")[at.Analiz], find("MM")[at.Dokümantasyon], find("MM")[at.Uyarlama], find("MM")[at["Birim Test"]]],
  [4, 2, 8, 3]
);
assert.deepEqual(
  [find("PP")[at.Analiz], find("PP")[at.Dokümantasyon], find("PP")[at.Uyarlama], find("PP")[at["Birim Test"]]],
  [4, 2, 6, 3]
);
assert.deepEqual(mergeFvbVmpRows(result), result, "merge must be idempotent");
assert.equal(result.at(-1)[at.Uyarlama], 7, "unrelated rows must remain unchanged");

const cleaned = removeObsoleteTeamSplitScopeQuestion({
  scopeQuestions: [{ id: "scope-28" }, { id: "scope-29" }, { id: "scope-30" }],
  restrictions: [["Restriction ID", "Question ID"], ["r-28", "scope-28"], ["r-29", "scope-29"]],
  scopeSizeImpacts: [["Question ID", "Puan"], ["scope-29", 5], ["scope-30", 2]],
  variableModulePhase: [["Kapsam Soru ID", "Hedef Modül"], ["scope-29", ""], ["scope-30", "QM"]]
});
assert.deepEqual(cleaned.scopeQuestions.map(item => item.id), ["scope-28", "scope-30"]);
assert.deepEqual(cleaned.restrictions, [["Restriction ID", "Question ID"], ["r-28", "scope-28"]]);
assert.deepEqual(cleaned.scopeSizeImpacts, [["Question ID", "Puan"], ["scope-30", 2]]);
assert.deepEqual(cleaned.variableModulePhase, [["Kapsam Soru ID", "Hedef Modül"], ["scope-30", "QM"]]);

console.log("VMP maintenance tests passed");

import fs from "node:fs/promises";
import vm from "node:vm";
import { pool, query } from "../src/db.js";

const outputUrl = new URL("../../frontend/public/assets/admin-data.js", import.meta.url);

function questionTable(existing = [], questions = []) {
  const headerIndex = existing.findIndex(row => Array.isArray(row) && row[0] === "No");
  const prefix = headerIndex >= 0 ? existing.slice(0, headerIndex + 1) : [["No", "Değişken Tanım (Soru)", "Değişken Açıklama", "Cevap için baz değer", "Puan", "Cevap (Evet/Hayır)", "Adet (opsiyonel)", "Hesaplanan Puan"]];
  return [...prefix, ...questions.map((item, index) => [
    index + 1,
    item.name || "",
    item.description || "",
    item.variableType || (item.answerType === "number" ? "Sayı" : "Evet / Hayır"),
    Number(item.score) || 0,
    "", "", ""
  ])];
}

try {
  const existingSource = await fs.readFile(outputUrl, "utf8");
  const context = { window: {} };
  vm.runInNewContext(existingSource, context, { filename: "admin-data.js" });
  const seed = { ...(context.window.adminSeedData || {}) };
  const result = await query(`select entity, payload from admin_config where entity <> 'approvalSettings' order by entity`);
  const live = Object.fromEntries(result.rows.map(row => [row.entity, row.payload]));
  Object.assign(seed, live);
  if (Array.isArray(live.scopeQuestions)) seed.scope = questionTable(seed.scope, live.scopeQuestions);
  if (Array.isArray(live.developmentQuestions)) seed.development = questionTable(seed.development, live.developmentQuestions);
  delete seed.scopeQuestions;
  delete seed.developmentQuestions;

  const source = `window.adminSeedData = ${JSON.stringify(seed)};\n`;
  const tempUrl = new URL("../../frontend/public/assets/admin-data.js.tmp", import.meta.url);
  await fs.writeFile(tempUrl, source, "utf8");
  await fs.rename(tempUrl, outputUrl);
  console.log(`Canlı admin verisi ${outputUrl.pathname} dosyasına aktarıldı.`);
} finally {
  await pool.end();
}

import fs from "node:fs/promises";
import vm from "node:vm";
import { pool, query } from "../src/db.js";

async function loadFrontendSeed() {
  const context = { window: {} };
  const questionsSource = await fs.readFile(new URL("../../frontend/public/assets/questions.js", import.meta.url), "utf8");
  const adminSource = await fs.readFile(new URL("../../frontend/public/assets/admin-data.js", import.meta.url), "utf8");
  vm.runInNewContext(questionsSource, context, { filename: "questions.js" });
  vm.runInNewContext(adminSource, context, { filename: "admin-data.js" });
  const seed = context.window.adminSeedData || {};
  return {
    projectDefinitions: seed.projectDefinitions,
    scopeQuestions: context.window.scopeQuestions
      .map(item => {
        const next = { ...item, id: String(item.id || `scope-${item.no}`) };
        delete next.no;
        return next;
      })
      .sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true, sensitivity: "base" })),
    developmentQuestions: context.window.developmentQuestions
      .map(item => {
        const next = { ...item, id: String(item.id || `dev-${item.no}`) };
        delete next.no;
        return next;
      })
      .sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true, sensitivity: "base" })),
    libraryItems: seed.libraryItems,
    questionFieldOptions: seed.questionFieldOptions,
    restrictions: seed.restrictions,
    fixedDays: seed.fixedDays,
    sizeRanges: seed.sizeRanges,
    scopeSizeImpacts: seed.scopeSizeImpacts,
    effortPhases: seed.effortPhases,
    localizationEfforts: seed.localizationEfforts,
    variableModulePhase: seed.variableModulePhase
  };
}

try {
  const result = await query(`select count(*)::int as count from admin_config`);
  const count = Number(result.rows[0]?.count) || 0;
  if (count) {
    console.log(`Canlı admin_config korundu: ${count} veri kümesi mevcut. Yerel seed uygulanmadı.`);
  } else {
    const entries = Object.entries(await loadFrontendSeed()).filter(([, payload]) => payload != null);
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const [entity, payload] of entries) {
        await client.query(`insert into admin_config (entity, payload) values ($1, $2::jsonb)`, [entity, JSON.stringify(payload)]);
      }
      await client.query("commit");
      console.log(`Boş admin_config için ${entries.length} başlangıç veri kümesi yüklendi.`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}

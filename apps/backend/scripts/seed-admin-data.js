import fs from "node:fs";
import vm from "node:vm";
import { pool, query } from "../src/db.js";

function readWindowAsset(relativePath) {
  const assetUrl = new URL(`../../frontend/public/assets/${relativePath}`, import.meta.url);
  const code = fs.readFileSync(assetUrl, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { filename: relativePath });
  return sandbox.window;
}

const adminWindow = readWindowAsset("admin-data.js");
const fixedWindow = readWindowAsset("fixed-days.js");
const questionWindow = readWindowAsset("questions.js");

const seedPayloads = {
  projectDefinitions: adminWindow.adminSeedData?.projectDefinitions || [],
  scopeQuestions: adminWindow.adminSeedData?.scopeQuestions || questionWindow.scopeQuestions || [],
  developmentQuestions: adminWindow.adminSeedData?.developmentQuestions || questionWindow.developmentQuestions || [],
  questionRestrictions: adminWindow.adminSeedData?.questionRestrictions || [],
  fixedDays: adminWindow.adminSeedData?.fixedDays || [],
  fixedDaysByImplementation: fixedWindow.fixedDaysByImplementation || {},
  localizationEfforts: adminWindow.adminSeedData?.localizationEfforts || [],
  variableModulePhase: adminWindow.adminSeedData?.variableModulePhase || [],
  moduleCatalog: questionWindow.moduleCatalog || [],
  localizationCatalog: questionWindow.localizationCatalog || []
};

try {
  for (const [entity, payload] of Object.entries(seedPayloads)) {
    await query(
      `insert into admin_config (entity, payload)
       values ($1, $2::jsonb)
       on conflict (entity) do update set payload = excluded.payload, updated_at = now()`,
      [entity, JSON.stringify(payload)]
    );
  }
  console.log(`Seeded ${Object.keys(seedPayloads).length} admin datasets.`);
} finally {
  await pool.end();
}

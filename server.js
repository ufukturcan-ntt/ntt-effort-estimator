import "dotenv/config";
import fs from "node:fs/promises";
import express from "express";
import cors from "cors";
import { query } from "./db.js";

const app = express();
const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ntt-effort-backend" });
});

app.post("/api/login", async (req, res, next) => {
  try {
    const { username = "ufuk.turcan", displayName = "Ufuk Turcan" } = req.body || {};
    const result = await query(
      `insert into app_user (username, display_name)
       values ($1, $2)
       on conflict (username) do update set display_name = excluded.display_name
       returning id, username, display_name`,
      [username, displayName]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const result = await query(
      `select id, offer_no, title, customer_name, project_name, industry, implementation_type,
              system_type, status, total_effort, updated_at
       from offer
       where ($1::uuid is null or user_id = $1::uuid)
       order by updated_at desc
       limit 200`,
      [userId || null]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers/:id", async (req, res, next) => {
  try {
    const result = await query(`select * from offer where id = $1`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await query(
      `insert into offer (
        user_id, offer_no, title, customer_name, project_name, industry, implementation_type,
        system_type, status, total_effort, project_definition, scope_answers,
        development_answers, module_selection, localization_selection, hypercare_inputs,
        final_effort
      ) values (
        $1, coalesce($2, next_offer_no()), $3, $4, $5, $6, $7, $8, coalesce($9, 'DRAFT'),
        coalesce($10, 0), coalesce($11::jsonb, '{}'::jsonb), coalesce($12::jsonb, '{}'::jsonb),
        coalesce($13::jsonb, '{}'::jsonb), coalesce($14::jsonb, '{}'::jsonb), coalesce($15::jsonb, '{}'::jsonb),
        coalesce($16::jsonb, '{}'::jsonb), coalesce($17::jsonb, '{}'::jsonb)
      )
      returning *`,
      [
        payload.userId || null,
        payload.offerNo || null,
        payload.title || "Yeni Teklif",
        payload.customerName || null,
        payload.projectName || null,
        payload.industry || null,
        payload.implementationType || null,
        payload.systemType || null,
        payload.status || "DRAFT",
        payload.totalEffort || 0,
        JSON.stringify(payload.projectDefinition || {}),
        JSON.stringify(payload.scopeAnswers || {}),
        JSON.stringify(payload.developmentAnswers || {}),
        JSON.stringify(payload.moduleSelection || {}),
        JSON.stringify(payload.localizationSelection || {}),
        JSON.stringify(payload.hypercareInputs || {}),
        JSON.stringify(payload.finalEffort || {})
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put("/api/offers/:id", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await query(
      `update offer set
        title = coalesce($2, title),
        customer_name = coalesce($3, customer_name),
        project_name = coalesce($4, project_name),
        industry = coalesce($5, industry),
        implementation_type = coalesce($6, implementation_type),
        system_type = coalesce($7, system_type),
        status = coalesce($8, status),
        total_effort = coalesce($9, total_effort),
        project_definition = coalesce($10::jsonb, project_definition),
        scope_answers = coalesce($11::jsonb, scope_answers),
        development_answers = coalesce($12::jsonb, development_answers),
        module_selection = coalesce($13::jsonb, module_selection),
        localization_selection = coalesce($14::jsonb, localization_selection),
        hypercare_inputs = coalesce($15::jsonb, hypercare_inputs),
        final_effort = coalesce($16::jsonb, final_effort),
        updated_at = now()
       where id = $1
       returning *`,
      [
        req.params.id,
        payload.title,
        payload.customerName,
        payload.projectName,
        payload.industry,
        payload.implementationType,
        payload.systemType,
        payload.status,
        payload.totalEffort,
        payload.projectDefinition == null ? null : JSON.stringify(payload.projectDefinition),
        payload.scopeAnswers == null ? null : JSON.stringify(payload.scopeAnswers),
        payload.developmentAnswers == null ? null : JSON.stringify(payload.developmentAnswers),
        payload.moduleSelection == null ? null : JSON.stringify(payload.moduleSelection),
        payload.localizationSelection == null ? null : JSON.stringify(payload.localizationSelection),
        payload.hypercareInputs == null ? null : JSON.stringify(payload.hypercareInputs),
        payload.finalEffort == null ? null : JSON.stringify(payload.finalEffort)
      ]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/offers/:id", async (req, res, next) => {
  try {
    await query(`delete from offer where id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin", async (_req, res, next) => {
  try {
    const result = await query(`select entity, payload from admin_config order by entity`);
    res.json(Object.fromEntries(result.rows.map(row => [row.entity, row.payload])));
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/:entity", async (req, res, next) => {
  try {
    const result = await query(
      `insert into admin_config (entity, payload)
       values ($1, $2::jsonb)
       on conflict (entity) do update set payload = excluded.payload, updated_at = now()
       returning entity, payload`,
      [req.params.entity, JSON.stringify(req.body || {})]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Unexpected error" });
});

async function ensureDatabase() {
  const schema = await fs.readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  await query(schema);
}

ensureDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on ${port}`);
    });
  })
  .catch(error => {
    console.error("Database initialization failed", error);
    process.exit(1);
  });

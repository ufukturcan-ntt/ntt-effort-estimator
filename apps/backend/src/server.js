import "dotenv/config";
import fs from "node:fs/promises";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { query } from "./db.js";

const app = express();
const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";
const appPublicUrl = process.env.APP_PUBLIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || "";
const approvalToken = process.env.ADMIN_APPROVAL_TOKEN || "change-me";

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ntt-effort-backend" });
});

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function publicBaseUrl() {
  const raw = String(appPublicUrl || "").trim().replace(/\/$/, "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function sendApprovalMail(user) {
  const approverEmail = process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL;
  if (!approverEmail) {
    console.log(`Approval requested for ${user.email}. No APPROVER_EMAIL configured.`);
    return;
  }
  const approvalUrl = publicBaseUrl()
    ? `${publicBaseUrl()}/api/admin/users/${user.id}/approve?token=${encodeURIComponent(approvalToken)}`
    : "";
  const subject = "NTT Effort Estimator kullanıcı onayı";
  const text = [
    `${user.display_name} (${user.email}) uygulamaya erişim talep etti.`,
    approvalUrl ? `Onay linki: ${approvalUrl}` : "Onay için admin ekranındaki Kullanıcı Onayları bölümünü kullanın."
  ].join("\n\n");
  if (!process.env.SMTP_HOST) {
    console.log(text);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || approverEmail,
    to: approverEmail,
    subject,
    text
  });
}

async function sendOfferApprovalMail(offer) {
  const approverEmail = process.env.OFFER_APPROVER_EMAIL || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL;
  if (!approverEmail) {
    console.log(`Offer approval requested for ${offer.offer_no}. No OFFER_APPROVER_EMAIL configured.`);
    return;
  }
  const approvalUrl = publicBaseUrl()
    ? `${publicBaseUrl()}/api/offers/${offer.id}/approve?token=${encodeURIComponent(approvalToken)}`
    : "";
  const subject = `Teklif onayı: ${offer.offer_no || offer.title}`;
  const text = [
    `${offer.offer_no || ""} numaralı teklif onaya gönderildi.`,
    `Müşteri: ${offer.customer_name || "-"}`,
    `Proje: ${offer.project_name || offer.title || "-"}`,
    approvalUrl ? `Onay linki: ${approvalUrl}` : "Onay için uygulamadaki admin ekranını kullanın."
  ].join("\n");
  if (!process.env.SMTP_HOST) {
    console.log(text);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || approverEmail,
    to: approverEmail,
    subject,
    text
  });
}

app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) return res.status(400).json({ error: "Email and password required" });
    const result = await query(
      `select id, username, email, display_name, role, is_admin, status
       from app_user
       where lower(email) = $1
         and status = 'APPROVED'
         and password_hash = crypt($2, password_hash)`,
      [normalizedEmail, password]
    );
    if (!result.rowCount) return res.status(401).json({ error: "User is not approved or credentials are invalid" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password || !displayName) {
      return res.status(400).json({ error: "Email, password and display name required" });
    }
    const existing = await query(`select id, email, display_name, status from app_user where lower(email) = $1`, [normalizedEmail]);
    let result;
    if (existing.rowCount) {
      if (existing.rows[0].status !== "PENDING") return res.status(409).json({ error: "User already exists" });
      result = await query(
        `update app_user
         set display_name = $2,
             password_hash = crypt($3, gen_salt('bf'))
         where id = $1
         returning id, email, display_name, status`,
        [existing.rows[0].id, displayName, password]
      );
    } else {
      result = await query(
        `insert into app_user (username, email, display_name, role, is_admin, status, password_hash)
         values ($1, $1, $2, 'USER', false, 'PENDING', crypt($3, gen_salt('bf')))
         returning id, email, display_name, status`,
        [normalizedEmail, displayName, password]
      );
    }
    await sendApprovalMail(result.rows[0]);
    res.status(202).json({ ok: true, status: result.rows[0].status });
  } catch (error) {
    next(error);
  }
});

async function isAdminUser(userId) {
  if (!userId) return false;
  const result = await query(`select is_admin from app_user where id = $1 and status = 'APPROVED'`, [userId]);
  return Boolean(result.rows[0]?.is_admin);
}

app.get("/api/admin/users/pending", async (req, res, next) => {
  try {
    if (!(await isAdminUser(req.query.adminUserId))) return res.status(403).json({ error: "Admin authorization required" });
    const result = await query(
      `select id, email, display_name, status, created_at
       from app_user
       where status = 'PENDING'
       order by created_at asc`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users/:id/approve", async (req, res, next) => {
  try {
    const adminUserId = req.body?.adminUserId;
    if (!(await isAdminUser(adminUserId))) return res.status(403).json({ error: "Admin authorization required" });
    const result = await query(
      `update app_user
       set status = 'APPROVED', approved_by = $2, approved_at = now()
       where id = $1
       returning id, email, display_name, role, is_admin, status`,
      [req.params.id, adminUserId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users/:id/approve", async (req, res, next) => {
  try {
    if (req.query.token !== approvalToken) return res.status(403).send("Invalid approval token");
    const result = await query(
      `update app_user
       set status = 'APPROVED', approved_at = now()
       where id = $1
       returning email, display_name, status`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).send("User not found");
    res.send(`Approved: ${result.rows[0].email}`);
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
        coalesce($10::numeric, 0), coalesce($11::jsonb, '{}'::jsonb), coalesce($12::jsonb, '{}'::jsonb),
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
        total_effort = coalesce($9::numeric, total_effort),
        project_definition = coalesce($10::jsonb, project_definition),
        scope_answers = coalesce($11::jsonb, scope_answers),
        development_answers = coalesce($12::jsonb, development_answers),
        module_selection = coalesce($13::jsonb, module_selection),
        localization_selection = coalesce($14::jsonb, localization_selection),
        hypercare_inputs = coalesce($15::jsonb, hypercare_inputs),
        final_effort = coalesce($16::jsonb, final_effort),
        updated_at = now()
       where id = $1
         and status <> 'APPROVED'
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
    if (!result.rowCount) return res.status(409).json({ error: "Onaylanmış teklif güncellenemez veya teklif bulunamadı" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers/:id/submit", async (req, res, next) => {
  try {
    const userId = req.body?.userId || null;
    const result = await query(
      `update offer
       set status = 'SUBMITTED',
           submitted_by = $2,
           submitted_at = now(),
           updated_at = now()
       where id = $1
         and status <> 'APPROVED'
       returning *`,
      [req.params.id, userId]
    );
    if (!result.rowCount) return res.status(409).json({ error: "Onaylanmış teklif tekrar onaya gönderilemez veya teklif bulunamadı" });
    await sendOfferApprovalMail(result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers/:id/approve", async (req, res, next) => {
  try {
    const adminUserId = req.body?.adminUserId;
    if (!(await isAdminUser(adminUserId))) return res.status(403).json({ error: "Admin authorization required" });
    const result = await query(
      `update offer
       set status = 'APPROVED',
           approved_by = $2,
           approved_at = now(),
           updated_at = now()
       where id = $1
       returning *`,
      [req.params.id, adminUserId]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers/:id/approve", async (req, res, next) => {
  try {
    if (req.query.token !== approvalToken) return res.status(403).send("Invalid approval token");
    const result = await query(
      `update offer
       set status = 'APPROVED',
           approved_at = now(),
           updated_at = now()
       where id = $1
       returning offer_no, customer_name, project_name, status`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).send("Offer not found");
    res.send(`Approved: ${result.rows[0].offer_no}`);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/offers/:id", async (req, res, next) => {
  try {
    await query(`delete from offer where id = $1 and status <> 'APPROVED'`, [req.params.id]);
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

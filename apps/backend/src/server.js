import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { pool, query } from "./db.js";
import { bearerToken, createAccessToken, validOfferStatus, verifyAccessToken } from "./auth.js";

const app = express();
const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";
const appPublicUrl = process.env.APP_PUBLIC_URL || process.env.RAILWAY_PUBLIC_DOMAIN || "";
const approvalToken = process.env.ADMIN_APPROVAL_TOKEN;
const sessionSecret = process.env.SESSION_SECRET || process.env.ADMIN_APPROVAL_TOKEN;
const deeplApiKey = process.env.DEEPL_API_KEY || "";
const deeplApiUrl = (process.env.DEEPL_API_URL || "https://api-free.deepl.com").replace(/\/$/, "");
const translationCache = new Map();
const protectedAdminEmail = "ufuk.turcan@nttdata.com";

app.use(cors({ origin: frontendOrigin === "*" ? true : frontendOrigin }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "ntt-effort-backend" });
});

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

async function authenticatedUser(req) {
  const claims = verifyAccessToken(bearerToken(req.headers.authorization), sessionSecret);
  if (!claims) return null;
  const result = await query(
    `select id, username, email, display_name, role, is_admin, status
     from app_user where id = $1 and status = 'APPROVED'`,
    [claims.sub]
  );
  return result.rows[0] || null;
}

async function requireAuth(req, res, next) {
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: "Authentication required" });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.is_admin) return res.status(403).json({ error: "Admin authorization required" });
  next();
}

function requireApprovalToken(req, res, next) {
  if (!approvalToken) return res.status(503).send("Approval links are not configured");
  if (req.query.token !== approvalToken) return res.status(403).send("Invalid approval token");
  next();
}

function jsonObject(value, field) {
  if (value == null) return value;
  if (typeof value !== "object" || Array.isArray(value)) {
    const error = new Error(`${field} must be a JSON object`);
    error.statusCode = 400;
    throw error;
  }
  return value;
}

function numericValue(value, field) {
  if (value == null || value === "") return value;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    const error = new Error(`${field} must be a finite number`);
    error.statusCode = 400;
    throw error;
  }
  return number;
}

function normalizedVersion(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function clientVersion(req, payload = req.body || {}) {
  return normalizedVersion(req.headers["if-match"] || payload.expectedUpdatedAt || payload.__meta?.expectedUpdatedAt);
}

function concurrencyConflict(message = "Bu kayıt başka bir kullanıcı tarafından güncellendi. Lütfen sayfayı yenileyip tekrar deneyin.") {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

function translationKey(sourceLang, targetLang, text) {
  return `${String(sourceLang || "").toUpperCase()}::${String(targetLang || "").toUpperCase()}::${text}`;
}

async function deeplTranslateBatch(texts, targetLang = "EN-US", sourceLang = "TR") {
  const uniqueTexts = [...new Set(texts.map(text => String(text || "").trim()).filter(Boolean))].slice(0, 80);
  if (!uniqueTexts.length) return {};
  const result = {};
  const missing = [];
  uniqueTexts.forEach(text => {
    const key = translationKey(sourceLang, targetLang, text);
    if (translationCache.has(key)) result[text] = translationCache.get(key);
    else missing.push(text);
  });
  if (!missing.length) return result;
  if (!deeplApiKey) {
    missing.forEach(text => {
      translationCache.set(translationKey(sourceLang, targetLang, text), text);
      result[text] = text;
    });
    return result;
  }
  const response = await fetch(`${deeplApiUrl}/v2/translate`, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${deeplApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: missing,
      source_lang: sourceLang,
      target_lang: targetLang,
      preserve_formatting: true,
      context: "SAP project effort estimator UI labels, module names, effort phases and proposal records."
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`DeepL translation failed: ${detail || response.status}`);
    error.statusCode = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }
  const data = await response.json();
  (data.translations || []).forEach((item, index) => {
    const source = missing[index];
    const translated = item?.text || source;
    translationCache.set(translationKey(sourceLang, targetLang, source), translated);
    result[source] = translated;
  });
  return result;
}

function publicBaseUrl() {
  const raw = String(appPublicUrl || "").trim().replace(/\/$/, "");
  if (!raw) return "";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

async function approvalSettings() {
  const result = await query(`select payload from admin_config where entity = 'approvalSettings'`);
  return result.rows[0]?.payload || {};
}

function configuredApproverEmails(value) {
  return String(value || "")
    .split(/[;,]/)
    .map(email => normalizeEmail(email))
    .filter(Boolean);
}

async function isOfferApprover(userId) {
  if (!userId) return false;
  const result = await query(
    `select email, is_admin from app_user where id = $1 and status = 'APPROVED'`,
    [userId]
  );
  const user = result.rows[0];
  if (!user) return false;
  if (user.is_admin) return true;
  const settings = await approvalSettings();
  const configured = settings.offerApproverEmail || process.env.OFFER_APPROVER_EMAIL || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL;
  return configuredApproverEmails(configured).includes(normalizeEmail(user.email));
}

async function sendApprovalMail(user) {
  const settings = await approvalSettings();
  const approverEmail = settings.userApproverEmail || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL;
  if (!approverEmail) {
    console.log(`Approval requested for ${user.email}. No APPROVER_EMAIL configured.`);
    return;
  }
  const approvalUrl = publicBaseUrl() && approvalToken
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
  const settings = await approvalSettings();
  const approverEmail = settings.offerApproverEmail || process.env.OFFER_APPROVER_EMAIL || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL;
  if (!approverEmail) {
    console.log(`Offer approval requested for ${offer.offer_no}. No OFFER_APPROVER_EMAIL configured.`);
    return;
  }
  const approvalUrl = publicBaseUrl() && approvalToken
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
    const user = result.rows[0];
    user.can_approve_offers = await isOfferApprover(user.id);
    user.access_token = createAccessToken(user, sessionSecret);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.get("/api/me", requireAuth, async (req, res, next) => {
  try {
    const user = { ...req.user };
    user.can_approve_offers = await isOfferApprover(user.id);
    res.json(user);
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

app.put("/api/account/password", requireAuth, async (req, res, next) => {
  try {
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");
    if (newPassword.length < 12) return res.status(400).json({ error: "Yeni şifre en az 12 karakter olmalı" });
    const result = await query(
      `update app_user
       set password_hash = crypt($3, gen_salt('bf'))
       where id = $1 and password_hash = crypt($2, password_hash)
       returning id`,
      [req.user.id, currentPassword, newPassword]
    );
    if (!result.rowCount) return res.status(400).json({ error: "Mevcut şifre hatalı" });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post("/api/translate", requireAuth, async (req, res, next) => {
  try {
    const texts = Array.isArray(req.body?.texts) ? req.body.texts : [];
    if (texts.length > 100) return res.status(400).json({ error: "Tek seferde en fazla 100 metin çevrilebilir" });
    const cleanTexts = texts.map(text => String(text || "").trim()).filter(Boolean);
    if (cleanTexts.some(text => text.length > 1000)) return res.status(400).json({ error: "Çevrilecek tek metin 1000 karakteri geçemez" });
    const sourceLang = String(req.body?.sourceLang || "TR").toUpperCase();
    const targetLang = String(req.body?.targetLang || "EN-US").toUpperCase();
    if (!["TR"].includes(sourceLang)) return res.status(400).json({ error: "Desteklenmeyen kaynak dil" });
    if (!["EN", "EN-US", "EN-GB"].includes(targetLang)) return res.status(400).json({ error: "Desteklenmeyen hedef dil" });
    const translations = await deeplTranslateBatch(cleanTexts, targetLang, sourceLang);
    res.json({ translations, provider: deeplApiKey ? "deepl" : "passthrough" });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      `select id, email, display_name, role, is_admin, status, created_at, approved_at
       from app_user
       order by created_at asc`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const role = String(req.body?.role || "").toUpperCase();
    if (!["USER", "ADMIN"].includes(role)) return res.status(400).json({ error: "Role must be USER or ADMIN" });
    const target = await query(`select email from app_user where id = $1`, [req.params.id]);
    if (!target.rowCount) return res.status(404).json({ error: "User not found" });
    if (normalizeEmail(target.rows[0].email) === protectedAdminEmail) {
      return res.status(409).json({ error: "Bu kullanıcı üzerinde işlem yapılamaz" });
    }
    const result = await query(
      `update app_user
       set role = $2,
           is_admin = ($2 = 'ADMIN')
       where id = $1
       returning id, email, display_name, role, is_admin, status, created_at, approved_at`,
      [req.params.id, role]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/users/pending", requireAuth, requireAdmin, async (req, res, next) => {
  try {
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

app.post("/api/admin/users/:id/approve", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const target = await query(`select email from app_user where id = $1`, [req.params.id]);
    if (!target.rowCount) return res.status(404).json({ error: "User not found" });
    if (normalizeEmail(target.rows[0].email) === protectedAdminEmail) {
      return res.status(409).json({ error: "Bu kullanıcı üzerinde işlem yapılamaz" });
    }
    const result = await query(
      `update app_user
       set status = 'APPROVED', approved_by = $2, approved_at = now()
       where id = $1
       returning id, email, display_name, role, is_admin, status`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});
app.get("/api/admin/users/:id/approve", requireApprovalToken, async (req, res, next) => {
  try {
    const target = await query(`select email from app_user where id = $1`, [req.params.id]);
    if (!target.rowCount) return res.status(404).send("User not found");
    if (normalizeEmail(target.rows[0].email) === protectedAdminEmail) {
      return res.status(409).send("Bu kullanıcı üzerinde işlem yapılamaz");
    }
    const result = await query(
      `update app_user
       set status = 'APPROVED', approved_at = now()
       where id = $1
       returning email, display_name, status`,
      [req.params.id]
    );
    res.send(`Approved: ${result.rows[0].email}`);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select id, user_id, offer_no, title, customer_name, project_name, industry, implementation_type,
              system_type, status, total_effort, project_definition, updated_at,
              (user_id = $1) as is_owner
       from offer
       order by updated_at desc
       limit 200`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers/pending-approval", requireAuth, async (req, res, next) => {
  try {
    if (!(await isOfferApprover(req.user.id))) return res.status(403).json({ error: "Offer approver authorization required" });
    const result = await query(
      `select o.id, o.offer_no, o.title, o.customer_name, o.project_name, o.industry, o.implementation_type,
              o.system_type, o.status, o.total_effort, o.submitted_at, o.updated_at,
              coalesce(submitter.display_name, owner.display_name, submitter.email, owner.email, '-') as submitted_by_name,
              coalesce(submitter.email, owner.email, '') as submitted_by_email
       from offer o
       left join app_user submitter on submitter.id = o.submitted_by
       left join app_user owner on owner.id = o.user_id
       where o.status = 'SUBMITTED'
       order by o.submitted_at asc nulls last, o.updated_at asc
       limit 200`
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers/:id", requireAuth, async (req, res, next) => {
  try {
    const result = await query(`select *, (user_id = $2) as is_owner from offer where id = $1`, [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Offer not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (payload.status && String(payload.status).toUpperCase() !== "DRAFT") {
      return res.status(400).json({ error: "Yeni teklifler yalnızca DRAFT statüsünde oluşturulabilir" });
    }
    if (payload.sourceOfferId) {
      const source = await query(`select user_id from offer where id = $1`, [payload.sourceOfferId]);
      if (!source.rowCount) return res.status(404).json({ error: "Kaynak teklif bulunamadı" });
      if (source.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Yalnızca kendi teklifinizi kopyalayabilirsiniz" });
    }
    const totalEffort = numericValue(payload.totalEffort, "totalEffort");
    ["projectDefinition", "scopeAnswers", "developmentAnswers", "moduleSelection", "localizationSelection", "hypercareInputs", "finalEffort"]
      .forEach(field => jsonObject(payload[field], field));
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
        req.user.id,
        payload.offerNo || null,
        payload.title || "Yeni Teklif",
        payload.customerName || null,
        payload.projectName || null,
        payload.industry || null,
        payload.implementationType || null,
        payload.systemType || null,
        "DRAFT",
        totalEffort ?? 0,
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

app.put("/api/offers/:id", requireAuth, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const expectedUpdatedAt = clientVersion(req, payload);
    const existing = await query(`select user_id, status, updated_at from offer where id = $1`, [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: "Teklif bulunamadı" });
    if (existing.rows[0].user_id !== req.user.id) return res.status(403).json({ error: "Yalnızca kendi teklifinizi değiştirebilirsiniz" });
    if (expectedUpdatedAt && normalizedVersion(existing.rows[0].updated_at) !== expectedUpdatedAt) throw concurrencyConflict("Bu teklif başka bir kullanıcı veya ekran tarafından güncellendi. Lütfen teklifi yeniden açıp tekrar deneyin.");
    const currentStatus = String(existing.rows[0].status || "").toUpperCase();
    if (!validOfferStatus(currentStatus)) return res.status(409).json({ error: "Teklifin mevcut statüsü geçersiz" });
    if (payload.status && String(payload.status).toUpperCase() !== currentStatus) {
      return res.status(400).json({ error: "Statü yalnızca onaya gönderme veya onaylama işlemiyle değiştirilebilir" });
    }
    const totalEffort = numericValue(payload.totalEffort, "totalEffort");
    ["projectDefinition", "scopeAnswers", "developmentAnswers", "moduleSelection", "localizationSelection", "hypercareInputs", "finalEffort"]
      .forEach(field => jsonObject(payload[field], field));
    const result = await query(
      `update offer set
        title = coalesce($2, title),
        customer_name = coalesce($3, customer_name),
        project_name = coalesce($4, project_name),
        industry = coalesce($5, industry),
        implementation_type = coalesce($6, implementation_type),
        system_type = coalesce($7, system_type),
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
         and user_id = $17
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
        null,
        totalEffort,
        payload.projectDefinition == null ? null : JSON.stringify(payload.projectDefinition),
        payload.scopeAnswers == null ? null : JSON.stringify(payload.scopeAnswers),
        payload.developmentAnswers == null ? null : JSON.stringify(payload.developmentAnswers),
        payload.moduleSelection == null ? null : JSON.stringify(payload.moduleSelection),
        payload.localizationSelection == null ? null : JSON.stringify(payload.localizationSelection),
        payload.hypercareInputs == null ? null : JSON.stringify(payload.hypercareInputs),
        payload.finalEffort == null ? null : JSON.stringify(payload.finalEffort),
        req.user.id
      ]
    );
    if (!result.rowCount) return res.status(409).json({ error: "Onaylanmış teklif güncellenemez veya teklif bulunamadı" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers/:id/submit", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `update offer
       set status = 'SUBMITTED',
           submitted_by = $2,
           submitted_at = now(),
           updated_at = now()
       where id = $1
         and user_id = $2
         and status = 'DRAFT'
       returning *`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(409).json({ error: "Onaylanmış teklif tekrar onaya gönderilemez veya teklif bulunamadı" });
    await sendOfferApprovalMail(result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post("/api/offers/:id/approve", requireAuth, async (req, res, next) => {
  try {
    if (!(await isOfferApprover(req.user.id))) return res.status(403).json({ error: "Offer approver authorization required" });
    const result = await query(
      `update offer
       set status = 'APPROVED',
           approved_by = $2,
           approved_at = now(),
           updated_at = now()
       where id = $1
         and status = 'SUBMITTED'
       returning *`,
      [req.params.id, req.user.id]
    );
    if (!result.rowCount) return res.status(409).json({ error: "Teklif onay beklemiyor veya bulunamadı" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get("/api/offers/:id/approve", requireApprovalToken, async (req, res, next) => {
  try {
    const result = await query(
      `update offer
       set status = 'APPROVED',
           approved_at = now(),
           updated_at = now()
       where id = $1
         and status = 'SUBMITTED'
       returning offer_no, customer_name, project_name, status`,
      [req.params.id]
    );
    if (!result.rowCount) return res.status(404).send("Offer not found");
    res.send(`Approved: ${result.rows[0].offer_no}`);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/offers/:id", requireAuth, async (req, res, next) => {
  try {
    const expectedUpdatedAt = clientVersion(req, { expectedUpdatedAt: req.query.expectedUpdatedAt });
    const existing = await query(`select user_id, status, updated_at from offer where id = $1`, [req.params.id]);
    if (!existing.rowCount) return res.status(404).json({ error: "Teklif bulunamadı" });
    if (expectedUpdatedAt && normalizedVersion(existing.rows[0].updated_at) !== expectedUpdatedAt) throw concurrencyConflict("Bu teklif başka bir kullanıcı veya ekran tarafından güncellendi. Lütfen listeyi yenileyip tekrar deneyin.");
    const result = await query(`delete from offer where id = $1 and user_id = $2 and status <> 'APPROVED' returning id`, [req.params.id, req.user.id]);
    if (!result.rowCount) return res.status(403).json({ error: "Teklif silinemedi; yalnızca sahibi onaylanmamış teklifi silebilir" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(`select entity, payload, updated_at from admin_config order by entity`);
    const config = Object.fromEntries(result.rows.map(row => [row.entity, row.payload]));
    config.__meta = {
      versions: Object.fromEntries(result.rows.map(row => [row.entity, normalizedVersion(row.updated_at)]))
    };
    config.approvalSettings = {
      userApproverEmail: config.approvalSettings?.userApproverEmail || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL || "",
      offerApproverEmail: config.approvalSettings?.offerApproverEmail || process.env.OFFER_APPROVER_EMAIL || process.env.APPROVER_EMAIL || process.env.ADMIN_EMAIL || ""
    };
    res.json(config);
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/config", requireAuth, requireAdmin, async (req, res, next) => {
  const config = req.body;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return res.status(400).json({ error: "Admin config must be a JSON object" });
  }
  const expectedVersions = config.__meta?.versions || {};
  const allowedEntities = new Set([
    "projectDefinitions", "moduleCatalog", "scopeQuestions", "developmentQuestions",
    "libraryItems", "questionFieldOptions", "restrictions", "fixedDays",
    "sizeRanges", "localizationEfforts", "variableModulePhase", "approvalSettings"
  ]);
  const entries = Object.entries(config).filter(([entity]) => entity !== "__meta");
  if (!entries.length || entries.some(([entity]) => !allowedEntities.has(entity))) {
    return res.status(400).json({ error: "Admin config contains an unsupported entity" });
  }
  const approval = config.approvalSettings;
  if (approval) {
    const emails = [approval.userApproverEmail, approval.offerApproverEmail].filter(Boolean);
    if (emails.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()))) {
      return res.status(400).json({ error: "Geçerli bir onay e-posta adresi girin" });
    }
    approval.userApproverEmail = String(approval.userApproverEmail || "").trim();
    approval.offerApproverEmail = String(approval.offerApproverEmail || "").trim();
  }
  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const [entity] of entries) {
      const expectedUpdatedAt = normalizedVersion(expectedVersions[entity]);
      if (!expectedUpdatedAt) continue;
      const current = await client.query(`select updated_at from admin_config where entity = $1 for update`, [entity]);
      if (!current.rowCount || normalizedVersion(current.rows[0].updated_at) !== expectedUpdatedAt) {
        throw concurrencyConflict("Admin bakım verisi başka bir kullanıcı tarafından güncellendi. Lütfen Admin sayfasını yenileyip tekrar deneyin.");
      }
    }
    for (const [entity, payload] of entries) {
      await client.query(
        `insert into admin_config (entity, payload)
         values ($1, $2::jsonb)
         on conflict (entity) do update set payload = excluded.payload, updated_at = now()`,
        [entity, JSON.stringify(payload)]
      );
    }
    const saved = await client.query(`select entity, payload, updated_at from admin_config where entity = any($1::text[]) order by entity`, [entries.map(([entity]) => entity)]);
    await client.query("commit");
    const savedConfig = Object.fromEntries(saved.rows.map(row => [row.entity, row.payload]));
    savedConfig.__meta = {
      versions: Object.fromEntries(saved.rows.map(row => [row.entity, normalizedVersion(row.updated_at)]))
    };
    res.json(savedConfig);
  } catch (error) {
    await client.query("rollback");
    next(error);
  } finally {
    client.release();
  }
});

app.put("/api/admin/:entity", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const expectedUpdatedAt = clientVersion(req, payload);
    if (expectedUpdatedAt) {
      const current = await query(`select updated_at from admin_config where entity = $1`, [req.params.entity]);
      if (!current.rowCount || normalizedVersion(current.rows[0].updated_at) !== expectedUpdatedAt) {
        throw concurrencyConflict("Admin bakım verisi başka bir kullanıcı tarafından güncellendi. Lütfen Admin sayfasını yenileyip tekrar deneyin.");
      }
    }
    if (req.params.entity === "approvalSettings") {
      const emails = [payload.userApproverEmail, payload.offerApproverEmail].filter(Boolean);
      if (emails.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()))) {
        return res.status(400).json({ error: "Geçerli bir onay e-posta adresi girin" });
      }
      payload.userApproverEmail = String(payload.userApproverEmail || "").trim();
      payload.offerApproverEmail = String(payload.offerApproverEmail || "").trim();
    }
    const result = await query(
      `insert into admin_config (entity, payload)
       values ($1, $2::jsonb)
       on conflict (entity) do update set payload = excluded.payload, updated_at = now()
       returning entity, payload, updated_at`,
      [req.params.entity, JSON.stringify(payload)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({ error: error.message || "Unexpected error" });
});

async function ensureDatabase() {
  if (!sessionSecret) throw new Error("SESSION_SECRET must be configured");
  const schema = await fs.readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  await query(schema);
  await ensureBootstrapAdmin();
  await migrateLibraryItemIds();
}

async function ensureBootstrapAdmin() {
  const existing = await query(`select 1 from app_user where is_admin = true and status = 'APPROVED' limit 1`);
  if (existing.rowCount) return;
  const email = normalizeEmail(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "");
  const displayName = String(process.env.BOOTSTRAP_ADMIN_NAME || "System Admin").trim();
  if (!email || password.length < 12) {
    throw new Error("İlk kurulum için BOOTSTRAP_ADMIN_EMAIL ve en az 12 karakterli BOOTSTRAP_ADMIN_PASSWORD gerekli");
  }
  await query(
    `insert into app_user (username, email, display_name, role, is_admin, status, password_hash, approved_at)
     values ($1, $1, $2, 'ADMIN', true, 'APPROVED', crypt($3, gen_salt('bf')), now())
     on conflict (username) do nothing`,
    [email, displayName, password]
  );
}

async function migrateLibraryItemIds() {
  const result = await query(`select payload from admin_config where entity = 'libraryItems'`);
  const matrix = result.rows[0]?.payload;
  if (!Array.isArray(matrix) || !matrix.length || !Array.isArray(matrix[0])) return;
  const headers = matrix[0].map(value => String(value || "").trim());
  const hadId = headers.includes("ID");
  const nextHeaders = hadId ? headers : ["ID", ...headers];
  const definitionIndex = nextHeaders.indexOf("Geliştirme Tanımı");
  const moduleIndex = nextHeaders.indexOf("Modül");
  const idIndex = nextHeaders.indexOf("ID");
  const legacyMap = new Map();
  let changed = !hadId;
  const rows = matrix.slice(1).filter(Array.isArray).map((sourceRow, index) => {
    const row = hadId ? [...sourceRow] : ["", ...sourceRow];
    if (!row[idIndex]) {
      row[idIndex] = crypto.randomUUID();
      changed = true;
    }
    const legacyKey = `${String(row[definitionIndex] || "").trim()}::${String(row[moduleIndex] || "").trim()}::${index}`;
    legacyMap.set(legacyKey, row[idIndex]);
    return row;
  });
  if (!changed) return;
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update admin_config set payload = $1::jsonb, updated_at = now() where entity = 'libraryItems'`,
      [JSON.stringify([nextHeaders, ...rows])]
    );
    const offers = await client.query(
      `select id, final_effort from offer where final_effort ? 'librarySelections'`
    );
    for (const offer of offers.rows) {
      const selections = Array.isArray(offer.final_effort?.librarySelections)
        ? offer.final_effort.librarySelections
        : [];
      const migrated = [...new Set(selections.map(key => legacyMap.get(String(key)) || String(key)))];
      if (JSON.stringify(migrated) === JSON.stringify(selections)) continue;
      await client.query(
        `update offer
         set final_effort = jsonb_set(final_effort, '{librarySelections}', $2::jsonb, true),
             updated_at = now()
         where id = $1`,
        [offer.id, JSON.stringify(migrated)]
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
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


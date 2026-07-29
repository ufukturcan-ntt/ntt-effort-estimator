import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createAccessToken(user, secret, now = Date.now()) {
  if (!secret) throw new Error("SESSION_SECRET is required");
  const payload = encode(JSON.stringify({
    sub: user.id,
    admin: Boolean(user.is_admin),
    exp: Math.floor(now / 1000) + TOKEN_TTL_SECONDS
  }));
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAccessToken(token, secret, now = Date.now()) {
  if (!token || !secret) return null;
  const [payload, signature, extra] = String(token).split(".");
  if (!payload || !signature || extra) return null;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const claims = JSON.parse(decode(payload));
    if (!claims.sub || Number(claims.exp) <= Math.floor(now / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export function bearerToken(header = "") {
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1] || "";
}

export function validOfferStatus(value) {
  return ["DRAFT", "SUBMITTED", "APPROVED"].includes(String(value || "").toUpperCase());
}

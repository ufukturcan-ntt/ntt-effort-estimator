import test from "node:test";
import assert from "node:assert/strict";
import { bearerToken, createAccessToken, validOfferStatus, verifyAccessToken } from "../src/auth.js";
import fs from "node:fs";

test("signed access token verifies and expires", () => {
  const token = createAccessToken({ id: "user-1", is_admin: false }, "test-secret", 1_000);
  assert.equal(verifyAccessToken(token, "test-secret", 2_000)?.sub, "user-1");
  assert.equal(verifyAccessToken(token, "wrong-secret", 2_000), null);
  assert.equal(verifyAccessToken(token, "test-secret", 8 * 60 * 60 * 1000 + 2_000), null);
});

test("bearer token parser rejects non-bearer authorization", () => {
  assert.equal(bearerToken("Bearer abc"), "abc");
  assert.equal(bearerToken("Basic abc"), "");
});

test("offer statuses are constrained", () => {
  assert.equal(validOfferStatus("DRAFT"), true);
  assert.equal(validOfferStatus("APPROVED"), true);
  assert.equal(validOfferStatus("BYPASSED"), false);
});

test("schema contains no hard-coded bootstrap password", () => {
  const schema = fs.readFileSync(new URL("../sql/schema.sql", import.meta.url), "utf8");
  assert.doesNotMatch(schema, /admin123/);
});

test("admin bulk save uses a database transaction", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.put\("\/api\/admin\/config"/);
  assert.match(server, /client\.query\("begin"\)/);
  assert.match(server, /client\.query\("commit"\)/);
  assert.match(server, /client\.query\("rollback"\)/);
});

test("offer update SQL uses contiguous parameter numbers", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /total_effort = coalesce\(\$8::numeric, total_effort\)/);
  assert.match(server, /final_effort = coalesce\(\$15::jsonb, final_effort\)/);
  assert.match(server, /and user_id = \$16/);
  assert.doesNotMatch(server, /payload\.systemType,\s*null,\s*totalEffort/s);
});

test("admin offer delete endpoint requires admin authorization", () => {
  const server = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(server, /app\.delete\("\/api\/admin\/offers\/:offerNo", requireAuth, requireAdmin/);
  assert.match(server, /where offer_no = \$1/);
});

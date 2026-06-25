import fs from "node:fs/promises";
import { pool, query } from "../src/db.js";

const schemaUrl = new URL("../sql/schema.sql", import.meta.url);
const schema = await fs.readFile(schemaUrl, "utf8");

try {
  await query(schema);
  console.log("Database schema is ready.");
} finally {
  await pool.end();
}

import { pool, query } from "../src/db.js";

try {
  const result = await query(`select count(*)::int as count from admin_config`);
  const count = Number(result.rows[0]?.count) || 0;
  if (!count) {
    throw new Error("Canlı admin_config boş. Yerel dosyalardan seed işlemi devre dışıdır.");
  }
  console.log(`Canlı admin_config korundu: ${count} veri kümesi mevcut. Yerel seed uygulanmadı.`);
} finally {
  await pool.end();
}

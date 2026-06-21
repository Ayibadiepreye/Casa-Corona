import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const pg = require("pg");
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env") });

async function main() {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const r = await c.query("SELECT user_id, type, title, body, created_at FROM notifications ORDER BY created_at DESC LIMIT 5");
  console.log("--- Recent notifications ---");
  for (const row of r.rows) console.log(row);
  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
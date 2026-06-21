import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const { config } = require("dotenv");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
c.connect()
  .then(() => c.query("SELECT count(*) FROM categories"))
  .then((r) => { console.log("Categories:", r.rows[0].count); return c.query("SELECT count(*) FROM platform_settings"); })
  .then((r) => { console.log("Settings:", r.rows[0].count); return c.query("SELECT slug, name FROM categories ORDER BY display_order LIMIT 5"); })
  .then((r) => { console.log("Sample categories:", r.rows); return c.end(); })
  .catch((e) => { console.error("ERR:", e.message); process.exit(1); });
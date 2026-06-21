import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const { config } = require("dotenv");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

c.connect()
  .then(() => c.query('SELECT count(*) FROM "vendors" WHERE "deleted_at" IS NULL'))
  .then((r) => {
    console.log("Vendors count:", r.rows);
    return c.query("SELECT id, name, slug FROM categories ORDER BY display_order LIMIT 5");
  })
  .then((r) => {
    console.log("Categories:", r.rows);
    return c.end();
  })
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
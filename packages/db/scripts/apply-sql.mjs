import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const require = createRequire(import.meta.url);
const { Client } = require("pg");
const { config } = require("dotenv");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = fs.readFileSync(
  path.resolve(__dirname, "..", "migrations", "0000_illegal_zzzax.sql"),
  "utf8"
);

// Drizzle uses --> statement-breakpoint as separator
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

console.log("Statements to apply:", statements.length);

c.connect()
  .then(async () => {
    let ok = 0, fail = 0;
    for (let i = 0; i < statements.length; i++) {
      try {
        await c.query(statements[i]);
        ok++;
      } catch (e) {
        fail++;
        console.error(`Statement ${i + 1} failed:`, e.message);
        console.error("SQL:", statements[i].slice(0, 200));
      }
    }
    console.log(`Done. ${ok} ok, ${fail} failed.`);
    await c.end();
  })
  .catch((e) => {
    console.error("Connect ERR:", e.message);
    process.exit(1);
  });
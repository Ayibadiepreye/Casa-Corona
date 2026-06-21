import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "..", "..", ".env") });

console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
console.log("URL preview:", process.env.DATABASE_URL?.slice(0, 50) + "...");

const pg = await import("pg");
const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
try {
  await c.connect();
  const r = await c.query("SELECT 1 as ok");
  console.log("DB OK:", r.rows);
  await c.end();
} catch (e: any) {
  console.error("DB ERR:", e.message);
  process.exit(1);
}
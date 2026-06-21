import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
loadEnv({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const url = process.env.DATABASE_URL;
console.log("Connecting to:", url.slice(0, 50) + "...");

// Fresh connection per statement to avoid pooler transaction issues
async function exec(sqlText) {
  const sql = postgres(url, { ssl: "require", max: 1, prepare: false });
  try {
    await sql.unsafe(sqlText);
  } finally {
    await sql.end({ timeout: 1 });
  }
}

const migrationSql = fs.readFileSync(
  path.resolve(__dirname, "..", "migrations", "0000_illegal_zzzax.sql"),
  "utf8"
);

const statements = migrationSql
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

console.log("Statements:", statements.length);

let ok = 0, fail = 0;
const failures = [];
for (let i = 0; i < statements.length; i++) {
  try {
    await exec(statements[i]);
    ok++;
  } catch (e) {
    fail++;
    failures.push({ i: i + 1, msg: e.message, sql: statements[i].slice(0, 80) });
  }
  if ((i + 1) % 20 === 0) console.log(`  ... ${i + 1}/${statements.length}`);
}
console.log(`\nResult: ${ok} ok, ${fail} failed`);
if (fail > 0) {
  console.log("\nFailures (first 10):");
  failures.slice(0, 10).forEach((f) =>
    console.log(`  #${f.i}: ${f.msg}\n     ${f.sql}`)
  );
}

// Check final state
const verify = postgres(url, { ssl: "require", max: 1 });
const tables = await verify`SELECT count(*) as n FROM pg_tables WHERE schemaname = 'public'`;
console.log("\nFinal tables count:", tables[0].n);
const list = await verify`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
console.log("Tables:", list.map((x) => x.tablename).join(", "));
await verify.end();
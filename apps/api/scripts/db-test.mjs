import { config as loadEnv } from "dotenv";
loadEnv();

async function main() {
  console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
  console.log("URL preview:", (process.env.DATABASE_URL || "").slice(0, 60) + "...");

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL);
  const r = await sql("SELECT 1 as ok, now() as ts");
  console.log("DB OK:", r);
}

main().catch((e) => {
  console.error("ERR:", e);
  process.exit(1);
});
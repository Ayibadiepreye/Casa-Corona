import { config as loadEnv } from "dotenv";
loadEnv();

async function main() {
  console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
  console.log("URL preview:", process.env.DATABASE_URL?.slice(0, 50) + "...");

  const pg = await import("pg");
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await c.connect();
    const r = await c.query("SELECT 1 as ok, now() as ts");
    console.log("DB OK:", r.rows);
    await c.end();
  } catch (e: any) {
    console.error("DB ERR:", e.message);
    process.exit(1);
  }
}

main();
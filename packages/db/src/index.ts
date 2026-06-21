import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";
import * as relations from "./relations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, "..", "..", "..", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// Use node-postgres (pg) driver instead of neon-http so DDL/joins/prepared
// statements work. Neon pooler requires rejectUnauthorized: false for
// self-signed certs in dev; pg picks this up from the connection string.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

export * from "./schema";
export * from "./relations";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
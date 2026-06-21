import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// packages/db/drizzle.config.ts -> repo root .env
loadEnv({ path: path.resolve(__dirname, "..", "..", ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in .env at repo root");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  verbose: true,
  strict: true,
});
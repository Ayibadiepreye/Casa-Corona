import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const Redis = require("ioredis");
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env") });

const url = process.env.REDIS_URL;
const r = new Redis(url);

async function main() {
  const targetEmail = process.argv[2] || "otp-real@demo.com";
  const otp = await r.get(`otp:${targetEmail}`);
  console.log(`OTP for ${targetEmail}:`, otp);

  const meta = await r.get(`otp_meta:${targetEmail}`);
  console.log(`Meta:`, meta);

  await r.quit();
}

main().catch(e => { console.error("ERR:", e.message); process.exit(1); });
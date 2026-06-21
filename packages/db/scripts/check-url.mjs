import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { config } = require("dotenv");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

const url = process.env.DATABASE_URL;
console.log("Length:", url?.length);
console.log("Host:", url?.match(/@([^/]+)/)?.[1]);
const pwd = url?.match(/:\/\/[^:]+:([^@]+)@/)?.[1];
console.log("Password length:", pwd?.length);
console.log("Password preview:", pwd?.slice(0, 4) + "..." + pwd?.slice(-2));
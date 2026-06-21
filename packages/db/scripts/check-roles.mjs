import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const pg = require("pg");
require("dotenv").config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "...[truncated]>").limit(10))
  .then((r) => {
    console.log(r.rows);
    return c.end();
  })
  .catch((e) => {
    console.error("ERR:", e.message);
    process.exit(1);
  });
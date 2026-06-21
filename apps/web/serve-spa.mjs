import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, "dist", "public");
const PORT = 8080;

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".txt":  "text/plain",
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  const filePath = path.join(DIST, urlPath);
  const ext = path.extname(filePath).toLowerCase();

  // Try to serve exact file first
  if (ext && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Fall back to index.html for SPA routing
  const index = path.join(DIST, "index.html");
  res.writeHead(200, { "Content-Type": "text/html" });
  fs.createReadStream(index).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n  Casa Corona running at http://localhost:${PORT}\n`);
});
